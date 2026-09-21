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
  const indexRef = useRef(0);
  const advancedRef = useRef(false);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [wide, setWide] = useState(false);
  const clip = clips[index] ?? clips[0];
  const nextClip = clips[(index + 1) % clips.length];
  const progress = duration ? Math.min(100, (current / duration) * 100) : 0;
  const remaining = duration > 0 ? Math.max(0, duration - current) : 0;
  const nearEnd = duration > 0 && remaining <= 2.2;

  const goTo = useCallback(
    (next: number) => {
      const wrapped = ((next % clips.length) + clips.length) % clips.length;
      advancedRef.current = false;
      indexRef.current = wrapped;
      setIndex(wrapped);
      setCurrent(0);
      setDuration(0);
      setPlaying(true);
    },
    [clips.length],
  );

  const advance = useCallback(() => {
    if (advancedRef.current) return;
    advancedRef.current = true;
    goTo(indexRef.current + 1);
  }, [goTo]);

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
    goTo(indexRef.current - 1);
  }, [goTo]);

  useEffect(() => {
    indexRef.current = index;
  }, [index]);

  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    if (hash === "watchnow" || hash === "watch") {
      document.getElementById("watchnow")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    const named = clips.findIndex((item) => hash === `watch-${item.id}` || hash === item.id);
    if (named >= 0) goTo(named);
  }, [clips, goTo]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    advancedRef.current = false;
    video.currentTime = 0;
    void video.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    const tick = window.setInterval(() => {
      if (video.ended || (!video.paused && video.duration > 0 && video.currentTime >= video.duration - 0.05)) {
        advance();
      }
    }, 200);
    return () => window.clearInterval(tick);
  }, [advance, clip.id]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;
      if (event.key === " ") {
        event.preventDefault();
        toggle();
      }
      if (event.key === "ArrowRight") goTo(indexRef.current + 1);
      if (event.key === "ArrowLeft") previous();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goTo, previous, toggle]);

  function syncTime() {
    const video = videoRef.current;
    if (!video) return;
    const nextDuration = Number.isFinite(video.duration) ? video.duration : 0;
    setCurrent(video.currentTime);
    setDuration(nextDuration);
    if (video.ended || (nextDuration > 0 && video.currentTime >= nextDuration - 0.08)) {
      advance();
    }
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
            onEnded={advance}
            onTimeUpdate={syncTime}
            onLoadedMetadata={syncTime}
            onPlay={() => setPlaying(true)}
            onPause={() => {
              const video = videoRef.current;
              if (video && !video.ended) setPlaying(false);
            }}
            onClick={toggle}
          />
          <video className="mkt-film-preload" src={nextClip.src} muted preload="auto" aria-hidden="true" tabIndex={-1} />
          <div className="mkt-film-live">Live {clip.label}</div>
          {nearEnd ? (
            <button type="button" className="mkt-film-nextup" onClick={() => goTo(index + 1)}>
              Next {nextClip.label} in {Math.max(1, Math.ceil(remaining))}s
            </button>
          ) : null}
          {!playing ? (
            <button type="button" className="mkt-film-play mkt-film-play-center" onClick={toggle} aria-label="Play module tour">
              <Play size={26} fill="currentColor" />
            </button>
          ) : null}
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
        </div>
        <div className="mkt-film-caption">
          <em>{clip.title}</em>
          <span>{clip.caption}</span>
        </div>
        <div className="mkt-playlist" aria-label="Module playlist">
          {clips.map((item, i) => (
            <button
              key={item.id}
              type="button"
              className={clsx(i === index && "active")}
              onClick={() => goTo(i)}
            >
              <img src={item.poster} alt="" />
              <span>{item.label}</span>
              {i === index ? (
                <b className="mkt-playlist-bar" aria-hidden="true">
                  <i style={{ width: `${progress}%` }} />
                </b>
              ) : null}
            </button>
          ))}
        </div>
      </div>
      <p className="mkt-watch-note">
        Each tab plays that live module. When a clip ends the next tab starts on its own. Pause, seek, or jump ahead
        from the playlist.
      </p>
    </section>
  );
}
