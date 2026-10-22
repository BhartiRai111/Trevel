import { NextResponse } from 'next/server';
import { markPaid } from '@/lib/pay';
import { verifyWebhookSignature } from '@/lib/razorpay';

export const dynamic = 'force-dynamic';

/** Razorpay webhook (set the URL in the Razorpay dashboard, event: payment.captured). Confirms payment even if the customer closes the tab. */
export async function POST(req: Request) {
  const raw = await req.text();
  if (!verifyWebhookSignature(raw, req.headers.get('x-razorpay-signature') ?? '')) return NextResponse.json({ error: 'Bad signature' }, { status: 400 });
  try {
    const ev = JSON.parse(raw);
    if (ev.event === 'payment.captured') {
      const pay = ev.payload?.payment?.entity;
      if (pay?.order_id && pay?.id) await markPaid(String(pay.order_id), String(pay.id));
    }
  } catch { /* ignore malformed body */ }
  return NextResponse.json({ ok: true });
}
