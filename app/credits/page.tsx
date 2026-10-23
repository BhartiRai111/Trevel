import type { Metadata } from 'next';
import Shell from '@/components/Shell';
import { allDestinations } from '@/lib/repo';
import data from '@/lib/photoManifest.json';

export const metadata: Metadata = { title: 'Photo credits', description: 'Who took the photographs on Roamora, and under which licence.' };
export const dynamic = 'force-dynamic';

type Credit = { dest: string; path: string; thumb: string; width: number; height: number; alt: string; place: string; title: string; creator: string; license: string; licenseUrl: string; source: string; changes: string };

export default async function CreditsPage() {
  const credits = (data as { credits: Credit[] }).credits;
  const names = Object.fromEntries((await allDestinations(false)).map(d => [d.slug, d.name]));
  const groups = [...new Set(credits.map(c => c.dest))];
  return (
    <Shell title="Photo credits">
      <p className="lead2">The photographs of places on Roamora are from Wikimedia Commons. Thank you to the photographers. Each photo is used under its own free licence, listed below with the photographer and a link to the original page.</p>
      <p className="muted small">We resized the photos for the web (and cropped where it says so). Resized copies stay under the same licence as the original: <b>CC BY-SA</b> photos are shared under CC BY-SA, <b>CC BY</b> photos need credit, <b>CC0</b> and public-domain photos have no conditions.</p>
      {groups.map(g => (
        <section key={g} id={g} className="xsec">
          <h2>{names[g] ?? g}</h2>
          <ul className="credits">
            {credits.filter(c => c.dest === g).map(c => (
              <li key={c.path}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={c.thumb} alt={c.alt} width={150} height={100} />
                <div>
                  <b>{c.place || c.alt}</b>
                  <p className="muted small">“{c.title}” by {c.creator}. <a href={c.licenseUrl || c.source} target="_blank" rel="noreferrer noopener license">{c.license}</a>. <a href={c.source} target="_blank" rel="noreferrer noopener">Original page</a>. {c.changes}.</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </Shell>
  );
}
