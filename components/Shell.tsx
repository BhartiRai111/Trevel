import type { ReactNode } from 'react';

/** Standard page frame: a title band that shows the animated background, then a light content panel. */
export default function Shell({ title, crumbs, wide, children }: { title: string; crumbs?: ReactNode; wide?: boolean; children: ReactNode }) {
  return (
    <main className={`pagewrap${wide ? ' wide' : ''}`}>
      <header className="phead">
        {crumbs && <p className="crumbs">{crumbs}</p>}
        <h1>{title}</h1>
      </header>
      <div className={`page${wide ? ' wide' : ''}`}>{children}</div>
    </main>
  );
}
