"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Maximize2, Pause, Play, SkipBack, SkipForward } from "lucide-react";
import { clsx } from "clsx";

export type FilmScene = {
  id: string;
  title: string;
  caption: string;
  durationMs: number;
  render: () => ReactNode;
};

export function ProductFilm({
  title,
  eyebrow = "Product film",
  scenes,
  autoPlayOnView = false,
}: {
  title: string;
  eyebrow?: string;
  scenes: FilmScene[];
  autoPlayOnView?: boolean;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [wide, setWide] = useState(false);
  const started = useRef(false);

  const total = useMemo(() => scenes.reduce((sum, s) => sum + s.durationMs, 0), [scenes]);
  const offsets = useMemo(() => {
    let cursor = 0;
    return scenes.map((scene) => {
      const start = cursor;
      cursor += scene.durationMs;
      return start;
    });
  }, [scenes]);

  const scene = scenes[index] ?? scenes[0];
  const globalTime = (offsets[index] ?? 0) + elapsed;
  const progress = total ? Math.min(100, (globalTime / total) * 100) : 0;

  const goTo = useCallback(
    (next: number) => {
      const clamped = Math.max(0, Math.min(scenes.length - 1, next));
      setIndex(clamped);
      setElapsed(0);
    },
    [scenes.length],
  );

  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => {
      setElapsed((ms) => {
        const sceneLen = scenes[index]?.durationMs ?? 4000;
        if (ms + 80 >= sceneLen) {
          if (index >= scenes.length - 1) {
            setPlaying(false);
            return sceneLen;
          }
          setIndex((i) => i + 1);
          return 0;
        }
        return ms + 80;
      });
    }, 80);
    return () => window.clearInterval(id);
  }, [playing, index, scenes]);

  useEffect(() => {
    if (!autoPlayOnView || started.current) return;
    const node = rootRef.current;
    if (!node) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          setPlaying(true);
        }
      },
      { threshold: 0.45 },
    );
    io.observe(node);
    return () => io.disconnect();
  }, [autoPlayOnView]);

  function toggle() {
    if (!playing && index === scenes.length - 1 && elapsed >= (scene?.durationMs ?? 0) - 20) {
      setIndex(0);
      setElapsed(0);
    }
    setPlaying((v) => !v);
  }

  function seek(pct: number) {
    const target = (pct / 100) * total;
    let acc = 0;
    for (let i = 0; i < scenes.length; i += 1) {
      const next = acc + scenes[i].durationMs;
      if (target <= next) {
        setIndex(i);
        setElapsed(target - acc);
        return;
      }
      acc = next;
    }
  }

  const clock = formatClock(globalTime);
  const endClock = formatClock(total);

  return (
    <div ref={rootRef} className={clsx("mkt-film", wide && "is-wide")}>
      <div className="mkt-film-meta">
        <span>{eyebrow}</span>
        <strong>{title}</strong>
      </div>
      <div className="mkt-film-stage">
        <button type="button" className="mkt-film-hit" onClick={toggle} aria-label={playing ? "Pause film" : "Play film"}>
          <div className={clsx("mkt-film-scene", playing && "is-live")} key={scene?.id}>
            {scene?.render()}
          </div>
        </button>
        {!playing && elapsed === 0 && index === 0 ? (
          <div className="mkt-film-poster">
            <button type="button" className="mkt-film-play" onClick={toggle} aria-label="Play product film">
              <Play size={22} fill="currentColor" />
            </button>
            <div>
              <div className="mkt-film-poster-kicker">{eyebrow}</div>
              <div className="mkt-film-poster-title">{title}</div>
            </div>
          </div>
        ) : null}
        <div className="mkt-film-caption">
          <em>{scene?.title}</em>
          <span>{scene?.caption}</span>
        </div>
      </div>
      <div className="mkt-film-controls">
        <button type="button" onClick={() => goTo(index - 1)} aria-label="Previous chapter">
          <SkipBack size={16} />
        </button>
        <button type="button" onClick={toggle} aria-label={playing ? "Pause" : "Play"}>
          {playing ? <Pause size={16} /> : <Play size={16} />}
        </button>
        <button type="button" onClick={() => goTo(index + 1)} aria-label="Next chapter">
          <SkipForward size={16} />
        </button>
        <div className="mkt-film-time">
          {clock} / {endClock}
        </div>
        <input
          type="range"
          min={0}
          max={100}
          step={0.5}
          value={progress}
          aria-label="Film progress"
          onChange={(e) => {
            setPlaying(false);
            seek(Number(e.target.value));
          }}
        />
        <button type="button" onClick={() => setWide((v) => !v)} aria-label="Expand film">
          <Maximize2 size={16} />
        </button>
      </div>
      <div className="mkt-film-chapters">
        {scenes.map((item, i) => (
          <button
            key={item.id}
            type="button"
            className={i === index ? "active" : undefined}
            onClick={() => {
              goTo(i);
              setPlaying(true);
            }}
          >
            {item.title}
          </button>
        ))}
      </div>
    </div>
  );
}

function formatClock(ms: number) {
  const totalSec = Math.round(ms / 1000);
  const m = String(Math.floor(totalSec / 60)).padStart(2, "0");
  const s = String(totalSec % 60).padStart(2, "0");
  return `${m}:${s}`;
}
