import { db } from './db';

/** Marks a payment and its booking as paid. Safe to call twice (checkout verify + webhook). */
export function markPaid(orderId: string, paymentId: string) {
  const d = db();
  const p = d.prepare('SELECT booking_id FROM payments WHERE order_id = ?').get(orderId) as unknown as { booking_id: number } | undefined;
  if (!p) return false;
  d.prepare("UPDATE payments SET status = 'paid', payment_id = ? WHERE order_id = ?").run(paymentId, orderId);
  d.prepare("UPDATE bookings SET status = 'paid', paid_at = ? WHERE id = ? AND status = 'confirmed'").run(Date.now(), p.booking_id);
  return true;
}
