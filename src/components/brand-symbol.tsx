import Image from "next/image";

type BrandSymbolProps = {
  className?: string;
  sculptural?: boolean;
};

/** The reference-derived metallic ribbon, shared by every brand placement. */
export function BrandSymbol({ className, sculptural = false }: BrandSymbolProps) {
  return (
    <Image
      src="/brand/siona-symbol.webp"
      alt=""
      aria-hidden="true"
      width={768}
      height={768}
      sizes={sculptural ? "(max-width: 640px) 65vw, 32vw" : "40px"}
      preload={sculptural}
      className={className}
    />
  );
}
