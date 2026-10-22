import crypto from 'node:crypto';

const keyId = () => process.env.RAZORPAY_KEY_ID ?? '';
const secret = () => process.env.RAZORPAY_KEY_SECRET ?? '';

export const paymentsEnabled = () => !!(keyId() && secret());
export const publicKeyId = keyId;

/** Creates a Razorpay order (amount in paise). Docs: https://razorpay.com/docs/api/orders/ */
export async function createOrder(amountPaise: number, receipt: string): Promise<{ id: string }> {
  const res = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Basic ' + Buffer.from(`${keyId()}:${secret()}`).toString('base64') },
    body: JSON.stringify({ amount: amountPaise, currency: 'INR', receipt }),
    signal: AbortSignal.timeout(15000)
  });
  if (!res.ok) throw new Error(`Razorpay order failed (${res.status})`);
  return res.json();
}

const safeEq = (a: string, b: string) => a.length === b.length && crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));

/** Checkout success signature: HMAC_SHA256(order_id + "|" + payment_id, key_secret) */
export function verifyCheckoutSignature(orderId: string, paymentId: string, signature: string) {
  const expected = crypto.createHmac('sha256', secret()).update(`${orderId}|${paymentId}`).digest('hex');
  return safeEq(expected, signature);
}

/** Webhook signature: HMAC_SHA256(raw body, webhook secret) */
export function verifyWebhookSignature(rawBody: string, signature: string) {
  const ws = process.env.RAZORPAY_WEBHOOK_SECRET ?? '';
  if (!ws) return false;
  return safeEq(crypto.createHmac('sha256', ws).update(rawBody).digest('hex'), signature);
}
