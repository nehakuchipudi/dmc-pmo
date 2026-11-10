"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

export function RowMenu({
  open,
  onClose,
  anchor,
  children,
}: {
  open: boolean;
  onClose: () => void;
  anchor: HTMLElement | null;
  children: ReactNode;
}) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0, maxHeight: 360 });

  useEffect(() => setMounted(true), []);

  useLayoutEffect(() => {
    if (!open || !anchor) return;
    function place() {
      if (!anchor) return;
      const rect = anchor.getBoundingClientRect();
      const width = 220;
      const pad = 8;
      let left = rect.right - width;
      left = Math.min(Math.max(pad, left), window.innerWidth - width - pad);
      const spaceBelow = window.innerHeight - rect.bottom - pad;
      const spaceAbove = rect.top - pad;
      const openUp = spaceBelow < 240 && spaceAbove > spaceBelow;
      const maxHeight = Math.max(160, Math.min(420, openUp ? spaceAbove : spaceBelow));
      const top = openUp ? Math.max(pad, rect.top - maxHeight) : rect.bottom + 4;
      setPos({ top, left, maxHeight });
    }
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open, anchor]);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    function onPointer(event: MouseEvent) {
      const target = event.target as Node;
      if (menuRef.current?.contains(target) || anchor?.contains(target)) return;
      onClose();
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointer);
    };
  }, [anchor, onClose, open]);

  if (!mounted || !open) return null;

  return createPortal(
    <div
      ref={menuRef}
      className="row-menu is-fixed"
      role="menu"
      style={{ top: pos.top, left: pos.left, maxHeight: pos.maxHeight }}
    >
      {children}
    </div>,
    document.body,
  );
}
