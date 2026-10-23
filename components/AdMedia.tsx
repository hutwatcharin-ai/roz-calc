'use client';

// The picture inside a sold slot (components/AdSlot). A still banner is a
// <picture>; a moving one starts as the same still and turns into its video
// once the page is running, so the server never guesses the screen width and
// a reader who asked for less motion keeps the still. The slot's box is fixed
// in size, so the swap moves nothing on the page.

import { useEffect, useState } from 'react';
import type { Ad } from '@/lib/ads';

interface Props {
  ad: Ad;
  size: { wide: [number, number]; narrow: [number, number] };
}

export default function AdMedia({ ad, size }: Props) {
  const [video, setVideo] = useState<{ src: string; poster: string } | null>(null);

  useEffect(() => {
    if (!ad.wideVideo) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    // Follows the screen as it changes (a window resized, a tablet turned),
    // or the box takes the phone shape around the desktop video.
    const query = window.matchMedia('(max-width: 700px)');
    const pick = () => {
      const narrow = query.matches && !!ad.narrowVideo;
      setVideo(
        narrow
          ? { src: ad.narrowVideo!, poster: ad.narrow ?? ad.wide }
          : { src: ad.wideVideo!, poster: ad.wide },
      );
    };
    pick();
    query.addEventListener('change', pick);
    return () => query.removeEventListener('change', pick);
  }, [ad.wideVideo, ad.narrowVideo, ad.wide, ad.narrow]);

  if (video) {
    return (
      <video
        key={video.src}
        src={video.src}
        poster={video.poster}
        autoPlay
        muted
        loop
        playsInline
        aria-label={ad.alt}
        width={size.wide[0]}
        height={size.wide[1]}
      />
    );
  }

  return (
    <picture>
      {ad.narrow && <source media="(max-width: 700px)" srcSet={ad.narrow} width={size.narrow[0]} height={size.narrow[1]} />}
      <img src={ad.wide} alt={ad.alt} width={size.wide[0]} height={size.wide[1]} loading="lazy" decoding="async" />
    </picture>
  );
}
