'use client';
import { unsplash } from '@/lib/places';
import { useSite } from './SiteProvider';

export default function Featured() {
  const { openBook } = useSite();
  return (
    <section className="featured photo" id="featured" style={{ ['--img' as string]: `url('${unsplash('photo-1464822759023-fed622ff2c3b', 2000, 80)}')` }}>
      <div className="feat-in">
        <div className="thumbs">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={unsplash('photo-1507525428034-b723cf961d3e', 300, 70)} alt="Beach at sunset" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={unsplash('photo-1501785888041-af3ef285b470', 300, 70)} alt="Lake and mountains" />
          <span className="more">20+</span>
        </div>
        <h2>Hill Track<br />National Park</h2>
        <div className="meta">
          <span className="stars" aria-label="5 stars">★★★★★</span>
          <span className="friends"><i /><i /><i /> +50 friends been here</span>
        </div>
        <p>Green ridges that fall straight into a turquoise bay. Walk the ridge trail at sunrise, swim at noon and camp under the stars. Guided groups leave every morning.</p>
        <div className="actions">
          <button className="btn btn-gold" type="button" onClick={() => openBook('Hill Track')}>Book now</button>
          <a className="btn btn-ghost" href="#places">See more places</a>
        </div>
      </div>
    </section>
  );
}
