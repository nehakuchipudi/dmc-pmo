"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Maximize2, Pause, Play, SkipBack, SkipForward } from "lucide-react";
import { clsx } from "clsx";

export type TourClip = {
  id: string;
  label: string;
  title: string;
  caption: string;
  src: string;
  poster: string;
};

function formatClock(seconds: number) {
  const total = Math.max(0, Math.round(seconds || 0));
  const m = String(Math.floor(total / 60)).padStart(2, "0");
  const s = String(total % 60).padStart(2, "0");
  return `${m}:${s}`;
}

export function LandingTour({ clips }: { clips: readonly TourClip[] }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [wide, setWide] = useState(false);
  const clip = clips[index] ?? clips[0];
  const nextClip = clips[(index + 1) % clips.length];
  const progress = duration ? Math.min(100, (current / duration) * 100) : 0;
  const nearEnd = duration > 0 && duration - current <= 1.4;

  const goTo = useCallback(
    (next: number) => {
      const wrapped = ((next % clips.length) + clips.length) % clips.length;
      setIndex(wrapped);
      setCurrent(0);
      setDuration(0);
      setPlaying(true);
    },
    [clips.length],
  );

  const toggle = useCallback(() => {
    const video = videoRef.current;
    if (!video) {
      setPlaying((value) => !value);
      return;
    }
    if (video.paused) {
      void video.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    } else {
      video.pause();
      setPlaying(false);
    }
  }, []);

  const previous = useCallback(() => {
    const video = videoRef.current;
    if (video && video.currentTime > 1.4) {
      video.currentTime = 0;
      setCurrent(0);
      void video.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
      return;
    }
    goTo(index - 1);
  }, [goTo, index]);

  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    if (hash === "watchnow" || hash === "watch") {
      document.getElementById("watchnow")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = 0;
    void video.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
  }, [clip.id]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;
      if (event.key === " ") {
        event.preventDefault();
        toggle();
      }
      if (event.key === "ArrowRight") goTo(index + 1);
      if (event.key === "ArrowLeft") previous();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goTo, index, previous, toggle]);

  function syncTime() {
    const video = videoRef.current;
    if (!video) return;
    setCurrent(video.currentTime);
    setDuration(Number.isFinite(video.duration) ? video.duration : 0);
  }

  function seek(pct: number) {
    const video = videoRef.current;
    if (!video || !video.duration) return;
    video.currentTime = (pct / 100) * video.duration;
    syncTime();
  }

  return (
    <section className="mkt-watch" id="watchnow">
      <span id="watch" className="mkt-watch-anchor" />
      <div className="mkt-tabs" role="tablist" aria-label="Live product tours">
        {clips.map((item, i) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={index === i}
            className={clsx(index === i && "active")}
            onClick={() => goTo(i)}
          >
            {item.label}
            {index === i ? (
              <span className="mkt-tab-progress" aria-hidden="true">
                <span style={{ width: `${progress}%` }} />
              </span>
            ) : null}
          </button>
        ))}
      </div>
      <div className={clsx("mkt-film", "mkt-film-hero", wide && "is-wide")}>
        <div className="mkt-film-stage">
          <video
            key={clip.id}
            ref={videoRef}
            className="mkt-live-video"
            src={clip.src}
            poster={clip.poster}
            muted
            playsInline
            autoPlay
            preload="auto"
            onEnded={() => goTo(index + 1)}
            onTimeUpdate={syncTime}
            onLoadedMetadata={syncTime}
            onPlay={() => setPlaying(true)}
            onPause={() => {
              const video = videoRef.current;
              if (video && !video.ended) setPlaying(false);
            }}
            onClick={toggle}
          />
          <div className="mkt-film-live">Live {clip.label}</div>
          {nearEnd ? <div className="mkt-film-nextup">Next: {nextClip.label}</div> : null}
          {!playing ? (
            <button type="button" className="mkt-film-play mkt-film-play-center" onClick={toggle} aria-label="Play module tour">
              <Play size={26} fill="currentColor" />
            </button>
          ) : null}
        </div>
        <div className="mkt-film-caption">
          <em>{clip.title}</em>
          <span>{clip.caption}</span>
        </div>
        <div className="mkt-film-controls">
          <button type="button" onClick={previous} aria-label="Previous module">
            <SkipBack size={16} />
          </button>
          <button type="button" onClick={toggle} aria-label={playing ? "Pause" : "Play"}>
            {playing ? <Pause size={16} /> : <Play size={16} />}
          </button>
          <button type="button" onClick={() => goTo(index + 1)} aria-label="Next module">
            <SkipForward size={16} />
          </button>
          <div className="mkt-film-time">
            {formatClock(current)} / {formatClock(duration)}
          </div>
          <input
            type="range"
            min={0}
            max={100}
            step={0.5}
            value={progress}
            aria-label="Clip progress"
            onChange={(event) => seek(Number(event.target.value))}
          />
          <button type="button" onClick={() => setWide((value) => !value)} aria-label="Expand film">
            <Maximize2 size={16} />
          </button>
        </div>
        <div className="mkt-film-chapters">
          {clips.map((item, i) => (
            <button
              key={item.id}
              type="button"
              className={i === index ? "active" : undefined}
              onClick={() => goTo(i)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
      <p className="mkt-watch-note">
        Each tab is that live module. The film advances on its own when a clip ends, or jump ahead with the tabs and
        controls.
      </p>
    </section>
  );
}
