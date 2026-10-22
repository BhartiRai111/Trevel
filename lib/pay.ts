import { after } from 'next/server';
import { one, tx } from './db';
import { notifyBooking } from './emails';

/** Marks a payment and its booking as paid. Safe to call twice (checkout verify + webhook). */
export async function markPaid(orderId: string, paymentId: string) {
  const p = await one<{ booking_id: number }>('SELECT booking_id FROM payments WHERE order_id = $1', [orderId]);
  if (!p) return false;
  const changed = await tx(async c => {
    await c.run("UPDATE payments SET status = 'paid', payment_id = $1 WHERE order_id = $2", [paymentId, orderId]);
    return c.run("UPDATE bookings SET status = 'paid', paid_at = $1 WHERE id = $2 AND status = 'confirmed'", [Date.now(), p.booking_id]);
  });
  if (changed) after(() => notifyBooking('paid', p.booking_id));
  return true;
}
