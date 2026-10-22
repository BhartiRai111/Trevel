/** GST on tour packages (5%). Change here if your tax setup differs. */
export const GST_RATE = 0.05;

export function quote(pricePerPerson: number, travellers: number) {
  const base = pricePerPerson * travellers;
  const gst = Math.round(base * GST_RATE);
  return { base, gst, fee: 0, total: base + gst };
}

export const inr = (n: number) => '₹' + n.toLocaleString('en-IN');
