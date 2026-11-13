"use client";

import { useEffect } from "react";

/**
 * Jeden mały komponent obsługujący efekty przewijania na całej stronie:
 *  - [data-reveal]  -> płynne pojawianie się sekcji (IntersectionObserver),
 *  - [data-speed]   -> delikatny parallax, WYŁĄCZNIE na desktopie z myszką.
 *
 * Na telefonach i przy "ogranicz animacje" parallax w ogóle się nie uruchamia,
 * a na desktopie liczy się tylko dla elementów aktualnie widocznych,
 * z jednym pasywnym listenerem scrolla i requestAnimationFrame.
 */
export default function ScrollEffects() {
  useEffect(() => {
    const cleanups: Array<() => void> = [];
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const hasObserver = "IntersectionObserver" in window;

    // ---- pojawianie się ----
    const revealEls = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    if (reduceMotion || !hasObserver) {
      revealEls.forEach((el) => el.classList.add("is-visible"));
    } else {
      const io = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
              io.unobserve(entry.target);
            }
          }
        },
        { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
      );
      revealEls.forEach((el) => io.observe(el));
      cleanups.push(() => io.disconnect());
    }

    // ---- animacje [data-anim] chodzą tylko, gdy sekcja jest widoczna ----
    const animEls = Array.from(document.querySelectorAll<HTMLElement>("[data-anim]"));
    if (!hasObserver) {
      animEls.forEach((el) => el.classList.add("is-inview"));
    } else {
      const animIo = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            entry.target.classList.toggle("is-inview", entry.isIntersecting);
          }
        },
        { rootMargin: "80px 0px" },
      );
      animEls.forEach((el) => animIo.observe(el));
      cleanups.push(() => animIo.disconnect());
    }

    // ---- parallax (tylko desktop + mysz) ----
    const parallaxAllowed =
      !reduceMotion &&
      hasObserver &&
      window.matchMedia("(min-width: 1024px) and (hover: hover) and (pointer: fine)").matches;

    if (parallaxAllowed) {
      const items = Array.from(document.querySelectorAll<HTMLElement>("[data-speed]")).map((el) => ({
        el,
        speed: Number(el.dataset.speed) || 0,
        host: el.closest<HTMLElement>("[data-parallax]") ?? el.parentElement ?? el,
      }));
      const visible = new Set<(typeof items)[number]>();
      let ticking = false;

      const update = () => {
        ticking = false;
        const half = window.innerHeight / 2;
        visible.forEach(({ el, speed, host }) => {
          // pozycja liczona z rodzica, który się nie przesuwa
          const offset = (host.getBoundingClientRect().top - half) * speed;
          const clamped = Math.max(-70, Math.min(70, offset));
          el.style.setProperty("--py", `${clamped.toFixed(1)}px`);
        });
      };

      const requestUpdate = () => {
        if (!ticking) {
          ticking = true;
          requestAnimationFrame(update);
        }
      };

      const io = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            const item = items.find((it) => it.el === entry.target);
            if (!item) continue;
            if (entry.isIntersecting) visible.add(item);
            else visible.delete(item);
          }
          requestUpdate();
        },
        { rootMargin: "120px 0px" },
      );
      items.forEach((it) => io.observe(it.el));

      window.addEventListener("scroll", requestUpdate, { passive: true });
      window.addEventListener("resize", requestUpdate, { passive: true });
      cleanups.push(() => {
        io.disconnect();
        window.removeEventListener("scroll", requestUpdate);
        window.removeEventListener("resize", requestUpdate);
      });
    }

    return () => cleanups.forEach((fn) => fn());
  }, []);

  return null;
}
