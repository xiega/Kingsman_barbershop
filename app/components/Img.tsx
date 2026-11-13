import { asset, imgSrcSet } from "@/lib/assets";

type Props = {
  /** nazwa bazowa pliku w public/img, np. "cut-1" albo "team/julita" */
  name: string;
  widths: readonly number[];
  sizes: string;
  width: number;
  height: number;
  alt: string;
  className?: string;
  priority?: boolean;
};

/**
 * Lekki <img> z srcset (WebP w kilku rozmiarach) i leniwym ładowaniem.
 * Nie korzysta z optymalizatora Next, więc działa tak samo na serwerze,
 * w eksporcie statycznym i za CDN-em (patrz lib/assets.ts).
 */
export default function Img({
  name,
  widths,
  sizes,
  width,
  height,
  alt,
  className,
  priority = false,
}: Props) {
  const fallbackWidth = widths[Math.min(1, widths.length - 1)];

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={asset(`/img/${name}-${fallbackWidth}.webp`)}
      srcSet={imgSrcSet(name, widths)}
      sizes={sizes}
      width={width}
      height={height}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      fetchPriority={priority ? "high" : "auto"}
      className={className}
    />
  );
}
