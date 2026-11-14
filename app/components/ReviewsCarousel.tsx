"use client";

import { useEffect, useRef } from "react";
import { FaArrowLeft, FaArrowRight, FaStar } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import type { Review } from "../data";
import { DICT, type Lang } from "../i18n";
import { useLive } from "./LiveContent";

function scrollStep(el: HTMLDivElement, direction: 1 | -1) {
  const card = el.querySelector<HTMLElement>("[data-card]");
  const amount = (card?.offsetWidth ?? 340) + 20;
  const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 8;

  if (direction === 1 && atEnd) {
    el.scrollTo({ left: 0, behavior: "smooth" });
  } else {
    el.scrollBy({ left: direction * amount, behavior: "smooth" });
  }
}

export default function ReviewsCarousel({ reviews: initial, lang = "pl" }: { reviews: Review[]; lang?: Lang }) {
  // opinie dodane w panelu /admin.php (content.json) mają pierwszeństwo przed Google i kodem
  const reviews = useLive((d) => d.reviews, initial);
  const t = DICT[lang].reviews;
  const trackRef = useRef<HTMLDivElement>(null);
  const userInteracted = useRef(false);

  // Autoplay: wolny, zatrzymuje się po pierwszej interakcji
  // i nie działa przy włączonym "ogranicz animacje".
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => {
      const el = trackRef.current;
      if (el && !userInteracted.current && !document.hidden) scrollStep(el, 1);
    }, 12000);
    return () => window.clearInterval(id);
  }, []);

  const manual = (direction: 1 | -1) => {
    userInteracted.current = true;
    if (trackRef.current) scrollStep(trackRef.current, direction);
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={() => manual(-1)}
          aria-label={t.prev}
          className="flex h-12 w-12 items-center justify-center border border-gold/40 text-gold transition-colors hover:bg-gold hover:text-black"
        >
          <FaArrowLeft />
        </button>
        <button
          type="button"
          onClick={() => manual(1)}
          aria-label={t.next}
          className="flex h-12 w-12 items-center justify-center border border-gold/40 text-gold transition-colors hover:bg-gold hover:text-black"
        >
          <FaArrowRight />
        </button>
      </div>

      <div
        ref={trackRef}
        onPointerDown={() => {
          userInteracted.current = true;
        }}
        className="no-scrollbar -mx-5 flex snap-x snap-mandatory gap-5 overflow-x-auto px-5 py-4 md:-mx-8 md:px-8"
        tabIndex={0}
        aria-label={t.list}
      >
        {reviews.map((review, index) => (
          <figure key={index} data-card className="review w-[85%] shrink-0 snap-start sm:w-[380px]">
            <div className="bio bio-a h-full">
              <div className="relative flex h-full min-h-[270px] flex-col justify-between overflow-hidden bg-gradient-to-br from-[#171717] to-[#0f0f0f] p-6 md:p-7">
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute bottom-16 right-5 select-none font-display text-[8rem] leading-none text-gold/[0.07]"
                >
                  “
                </span>
                <div className="relative">
                  <div className="mb-5 flex items-center justify-between gap-3">
                    <div className="flex gap-1 text-xs" aria-label={t.stars(review.rating ?? 5)}>
                      {[0, 1, 2, 3, 4].map((i) => (
                        <FaStar
                          key={i}
                          aria-hidden="true"
                          className={i < (review.rating ?? 5) ? "text-neon drop-shadow-[0_0_4px_rgba(255,233,74,0.55)]" : "text-white/15"}
                        />
                      ))}
                    </div>
                    <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">{review.date}</span>
                  </div>
                  <blockquote className="line-clamp-6 font-display text-[17px] leading-relaxed text-bone/90">
                    {lang === "en" ? `“${review.text}”` : `„${review.text}”`}
                  </blockquote>
                </div>
                <figcaption className="relative mt-6 flex items-center justify-between gap-3 border-t border-gold/15 pt-4">
                  <div className="flex items-center gap-3">
                    <span
                      aria-hidden="true"
                      className="flex h-10 w-10 items-center justify-center rounded-full border border-gold/50 bg-black font-semibold text-gold shadow-[0_0_12px_rgba(201,165,92,0.25)]"
                    >
                      {review.name.charAt(0)}
                    </span>
                    {review.url ? (
                      <a
                        href={review.url}
                        target="_blank"
                        rel="noopener noreferrer nofollow"
                        className="text-sm font-medium text-bone transition-colors hover:text-gold"
                      >
                        {review.name}
                      </a>
                    ) : (
                      <span className="text-sm font-medium text-bone">{review.name}</span>
                    )}
                  </div>
                  <FcGoogle className="text-2xl opacity-80" aria-label={t.google} />
                </figcaption>
              </div>
            </div>
          </figure>
        ))}
      </div>
    </div>
  );
}
