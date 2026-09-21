"use client";

import { useEffect, useRef, useState } from "react";
import { PRODUCT_TOURS, type TourId } from "./tours";

export function TourPlayer({
  initialId = "hero",
  autoPlay = true,
}: {
  initialId?: TourId;
  autoPlay?: boolean;
}) {
  const [activeId, setActiveId] = useState<TourId>(initialId);
  const videoRef = useRef<HTMLVideoElement>(null);
  const tour = PRODUCT_TOURS.find((item) => item.id === activeId) ?? PRODUCT_TOURS[0];

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = 0;
    if (autoPlay) void video.play().catch(() => undefined);
  }, [activeId, autoPlay]);

  return (
    <div className="mkt-tour">
      <div className="mkt-tour-stage">
        <video
          key={tour.id}
          ref={videoRef}
          className="mkt-tour-video"
          src={tour.src}
          poster={tour.poster}
          muted
          playsInline
          loop
          controls
          preload="metadata"
        />
        <div className="mkt-tour-badge">Live product</div>
      </div>
      <div className="mkt-tour-copy">
        <p className="mkt-tour-kicker">{tour.kicker}</p>
        <h3>{tour.title}</h3>
        <p>{tour.blurb}</p>
      </div>
      <div className="mkt-tour-thumbs" role="tablist" aria-label="Product tours">
        {PRODUCT_TOURS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={item.id === tour.id}
            className={item.id === tour.id ? "is-active" : undefined}
            onClick={() => setActiveId(item.id)}
          >
            <img src={item.poster} alt="" />
            <span>{item.title}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
