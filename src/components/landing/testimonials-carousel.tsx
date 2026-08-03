import { Quote, Star } from "lucide-react";

type Testimonial = {
  initials: string;
  name: string;
  location: string;
  rating: number;
  quote: string;
};

export function TestimonialsCarousel({ testimonials }: { testimonials: Testimonial[] }) {
  // Doubled so the marquee loop is seamless - translateX(-50%) lands exactly
  // back on the first set. Pure CSS animation (same technique as the bill
  // payments arc) rather than JS scrollLeft, so it can't be paused by a
  // vertical page-scroll gesture merely passing through this element.
  const doubled = [...testimonials, ...testimonials];

  return (
    <div className="mt-4 overflow-hidden">
      <div className="animate-marquee-x flex w-max gap-3">
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
    </div>
  );
}
