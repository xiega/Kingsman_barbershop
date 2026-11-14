"use client";

import { useEffect, useState } from "react";
import { FaBars, FaTimes } from "react-icons/fa";
import { asset, imgSrcSet } from "@/lib/assets";
import { BOOKING_URL } from "../data";
import { DICT, LANG_PATH, type Lang } from "../i18n";
import { AnnouncementBar } from "./LiveBits";

function LangSwitch({ lang, className = "" }: { lang: Lang; className?: string }) {
  const other: Lang = lang === "pl" ? "en" : "pl";
  return (
    <a
      href={LANG_PATH[other]}
      hrefLang={other}
      lang={other}
      aria-label={DICT[lang].switchTo}
      className={`flex h-11 items-center border border-white/15 px-3 text-[12px] font-semibold uppercase tracking-[0.18em] text-bone/80 transition-colors hover:border-gold hover:text-gold ${className}`}
    >
      {other}
    </a>
  );
}

export default function SiteHeader({ lang = "pl" }: { lang?: Lang }) {
  const t = DICT[lang];
  const NAV = t.nav;
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  // Jeden pasywny listener; stan zmienia się tylko przy przekroczeniu progu.
  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        setScrolled(window.scrollY > 24);
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // <html lang> jest ustawiony w layout.tsx na "pl"; na stronie /en/ poprawiamy go po załadowaniu
  useEffect(() => {
    document.documentElement.lang = t.htmlLang;
  }, [t.htmlLang]);

  const solid = scrolled || open;

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        solid ? "border-b border-white/10 bg-ink/95" : "bg-gradient-to-b from-black/70 to-transparent"
      }`}
    >
      <AnnouncementBar lang={lang} collapsed={scrolled || open} />
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-5 md:h-20 md:px-8">
        <a href="#top" className="flex shrink-0 items-center" aria-label={t.homeLabel}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={asset("/img/logo-full-480.webp")}
            srcSet={imgSrcSet("logo-full", [480, 966])}
            sizes="160px"
            width={160}
            height={41}
            alt="Kingsman Barbershop"
            className="h-9 w-auto md:h-10"
          />
        </a>

        <nav className="hidden items-center gap-9 md:flex" aria-label={t.mainNav}>
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-[13px] font-medium uppercase tracking-[0.18em] text-bone/75 transition-colors hover:text-gold"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <a
            href={BOOKING_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden bg-gold px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.18em] text-black transition-colors hover:bg-gold-light sm:inline-block"
          >
            {t.book}
          </a>
          <LangSwitch lang={lang} />
          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center border border-white/15 text-bone md:hidden"
            aria-label={open ? t.menuClose : t.menuOpen}
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <FaTimes /> : <FaBars />}
          </button>
        </div>
      </div>

      {open && (
        <nav id="mobile-menu" className="border-t border-white/10 bg-ink md:hidden" aria-label={t.mobileNav}>
          <ul className="mx-auto max-w-6xl px-5 py-3">
            {NAV.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="block border-b border-white/5 py-4 text-sm font-medium uppercase tracking-[0.2em] text-bone/85"
                >
                  {item.label}
                </a>
              </li>
            ))}
            <li className="py-4">
              <a
                href={BOOKING_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="block bg-gold px-5 py-3.5 text-center text-[13px] font-semibold uppercase tracking-[0.18em] text-black"
              >
                {t.book}
              </a>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
