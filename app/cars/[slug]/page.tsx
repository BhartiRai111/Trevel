import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getItem, type Car } from '@/lib/catalog';
import { img } from '@/lib/destinations';
import { isDate, readParams, type SP } from '@/lib/sp';
import BookPanel from '@/components/BookPanel';

export const dynamic = 'force-dynamic';
type Props = { params: Promise<{ slug: string }>; searchParams: SP };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const c = await getItem<Car>('car', (await params).slug);
  return c ? { title: `${c.name} in ${c.city}` } : {};
}

export default async function CarPage({ params, searchParams }: Props) {
  const c = await getItem<Car>('car', (await params).slug);
  if (!c) notFound();
  const p = await readParams(searchParams);
  return (
    <main>
      <section className="dhero photo" style={{ ['--img' as string]: (c.img ? `url('${img(c.img, 2000, 80)}')` : 'none') }}>
        <div className="dh-in">
          <p className="eyebrow">{c.city} · {c.type}</p><h1>{c.name}</h1>
          <p className="facts"><span>Seats {c.seats}</span><span>Driver included</span><span>250 km per day</span></p>
        </div>
      </section>
      <div className="detail">
        <div className="dcol">
          <h2>About this car</h2><p>{c.about}</p>
          <h2>Included</h2><ul className="tick"><li>Experienced driver and driver allowance</li><li>Fuel and toll charges for up to 250 km a day</li><li>Pick-up from your hotel or airport in {c.city}</li></ul>
          <p className="muted">Parking, state taxes at borders and night halt charges outside {c.city} may be extra and are shown by the driver. We confirm the car after you send a request.</p>
        </div>
        <BookPanel kind="car" slug={c.slug} title={c.name} price={c.price} seats={c.seats} initial={{ date: isDate(p.from) ? p.from : '', end: isDate(p.to) ? p.to : '', n: Math.min(2, c.seats) }} />
      </div>
    </main>
  );
}
