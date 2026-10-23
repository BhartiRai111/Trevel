import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getItem, type Hotel } from '@/lib/catalog';
import { img } from '@/lib/destinations';
import { isDate, readParams, type SP } from '@/lib/sp';
import BookPanel from '@/components/BookPanel';

export const dynamic = 'force-dynamic';
type Props = { params: Promise<{ slug: string }>; searchParams: SP };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const h = await getItem<Hotel>('hotel', (await params).slug);
  return h ? { title: h.name, description: `${h.stars}-star hotel in ${h.city}` } : {};
}

export default async function HotelPage({ params, searchParams }: Props) {
  const h = await getItem<Hotel>('hotel', (await params).slug);
  if (!h) notFound();
  const p = await readParams(searchParams);
  return (
    <main>
      <section className="dhero photo" style={{ ['--img' as string]: (h.img ? `url('${img(h.img, 2000, 80)}')` : 'none') }}>
        <div className="dh-in">
          <p className="eyebrow">{h.city}, {h.state}</p>
          <h1>{h.name}</h1>
          <p className="facts"><span>{'★'.repeat(h.stars)} {h.stars}-star</span><span>Rates per room per night</span></p>
        </div>
      </section>
      <div className="detail">
        <div className="dcol">
          <h2>About this hotel</h2><p>{h.about}</p>
          <h2>Amenities</h2><ul className="tick">{h.amenities.map(a => <li key={a}>{a}</li>)}</ul>
          <p className="muted">Each room fits up to 3 guests. We confirm availability for your dates after you send a request, and you pay only after that.</p>
        </div>
        <BookPanel kind="hotel" slug={h.slug} title={h.name} price={h.price} initial={{ date: isDate(p.checkin) ? p.checkin : '', end: isDate(p.checkout) ? p.checkout : '', n: Number(p.guests) || 2 }} />
      </div>
    </main>
  );
}
