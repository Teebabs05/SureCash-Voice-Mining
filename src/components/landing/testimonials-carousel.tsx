"use client";

import { useEffect, useRef } from "react";
import { Quote, Star } from "lucide-react";

type Testimonial = {
  initials: string;
  name: string;
  location: string;
  rating: number;
  quote: string;
};

const AUTO_SCROLL_SPEED = 0.4; // px per frame
const RESUME_DELAY_MS = 2500;

export function TestimonialsCarousel({ testimonials }: { testimonials: Testimonial[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);
  const expectedScrollLeftRef = useRef(0);
  const resumeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    let frameId: number;
    const step = () => {
      if (!pausedRef.current) {
        const halfWidth = track.scrollWidth / 2;
        let next = track.scrollLeft + AUTO_SCROLL_SPEED;
        if (next >= halfWidth) next -= halfWidth;
        track.scrollLeft = next;
        expectedScrollLeftRef.current = track.scrollLeft;
      }
      frameId = requestAnimationFrame(step);
    };
    frameId = requestAnimationFrame(step);

    return () => cancelAnimationFrame(frameId);
  }, []);

  // Only a manual swipe/drag should move scrollLeft away from what our own
  // rAF loop last set — that's how we tell user-driven scroll apart from a
  // vertical page-scroll gesture merely passing through this element.
  const onScroll = () => {
    const track = trackRef.current;
    if (!track) return;
    if (Math.abs(track.scrollLeft - expectedScrollLeftRef.current) < 1) return;

    pausedRef.current = true;
    if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
    resumeTimeoutRef.current = setTimeout(() => {
      pausedRef.current = false;
    }, RESUME_DELAY_MS);
  };

  const doubled = [...testimonials, ...testimonials];

  return (
    <div
      ref={trackRef}
      onScroll={onScroll}
      className="no-scrollbar mt-4 flex gap-3 overflow-x-auto overflow-y-hidden pb-1 touch-pan-x [-webkit-overflow-scrolling:touch]"
    >
      {doubled.map((t, i) => (
        <div key={`${t.name}-${i}`} className="card flex w-64 flex-none flex-col gap-3 p-4">
          <Quote className="h-5 w-5 text-brand-primary/40" />
          <p className="text-sm text-foreground/80">&ldquo;{t.quote}&rdquo;</p>
          <div className="mt-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-primary/10 text-[11px] font-bold text-brand-primary">
                {t.initials}
              </div>
              <div>
                <p className="text-xs font-semibold">{t.name}</p>
                <p className="text-[10px] text-foreground/50">{t.location}</p>
              </div>
            </div>
            <div className="flex items-center gap-0.5">
              {Array.from({ length: t.rating }).map((_, j) => (
                <Star key={j} className="h-3 w-3 fill-brand-amber text-brand-amber" />
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
