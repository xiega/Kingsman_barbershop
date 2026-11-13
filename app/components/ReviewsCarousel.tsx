"use client";

import { useEffect, useRef, useState } from "react";
import { FaArrowLeft, FaArrowRight, FaStar } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import type { Review } from "../data";
import { loadLive } from "./LiveContent";

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

export default function ReviewsCarousel({ reviews: initial }: { reviews: Review[] }) {
  // opinie dodane w panelu /admin.php (content.json) mają pierwszeństwo przed Google i kodem
  const [reviews, setReviews] = useState(initial);
  useEffect(() => {
    let alive = true;
    loadLive().then((d) => alive && d.reviews && setReviews(d.reviews));
    return () => {
      alive = false;
    };
  }, []);
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
      <div className="mb-8 flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={() => manual(-1)}
          aria-label="Poprzednie opinie"
          className="flex h-12 w-12 items-center justify-center border border-gold/40 text-gold transition-colors hover:bg-gold hover:text-black"
        >
          <FaArrowLeft />
        </button>
        <button
          type="button"
          onClick={() => manual(1)}
          aria-label="Następne opinie"
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
        className="no-scrollbar -mx-5 flex snap-x snap-mandatory gap-5 overflow-x-auto px-5 pb-2 md:-mx-8 md:px-8"
        tabIndex={0}
        aria-label="Opinie klientów"
      >
        {reviews.map((review, index) => (
          <figure
            key={index}
            data-card
            className="flex min-h-[260px] w-[85%] shrink-0 snap-start flex-col justify-between border border-white/10 bg-surface p-6 sm:w-[380px] md:p-7"
          >
            <div>
              <div className="mb-5 flex items-center justify-between gap-3">
                <div className="flex gap-1 text-xs" aria-label={`Ocena ${review.rating ?? 5} na 5`}>
                  {[0, 1, 2, 3, 4].map((i) => (
                    <FaStar
                      key={i}
                      aria-hidden="true"
                      className={i < (review.rating ?? 5) ? "text-gold" : "text-white/15"}
                    />
                  ))}
                </div>
                <span className="text-[11px] uppercase tracking-[0.15em] text-muted">{review.date}</span>
              </div>
              <blockquote className="line-clamp-6 font-display text-[17px] leading-relaxed text-bone/90">
                „{review.text}”
              </blockquote>
            </div>
            <figcaption className="mt-6 flex items-center justify-between gap-3 border-t border-white/10 pt-4">
              <div className="flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-gold/40 bg-black font-semibold text-gold"
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
              <FcGoogle className="text-2xl opacity-70" aria-label="Opinia z Google" />
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}
