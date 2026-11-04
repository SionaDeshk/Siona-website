type BrandSymbolProps = {
  className?: string;
  sculptural?: boolean;
};

/** A continuous, folded ribbon. All faces share the same architectural outline. */
export function BrandSymbol({ className, sculptural = false }: BrandSymbolProps) {
  return (
    <svg className={className} viewBox="0 0 360 360" fill="none" aria-hidden="true">
      <path
        d="M128 36H348L288 96H152L100 148H260L324 212L212 324H-8L52 264H188L240 212H80L16 148L128 36Z"
        transform="translate(10 0)"
        fill={sculptural ? "#555b4c" : "currentColor"}
      />
      {sculptural && (
        <g transform="translate(10 0)">
          <path d="M128 36H348L288 96H152L100 148H16L128 36Z" fill="#777c6a" />
          <path d="M16 148H260L324 212H80L16 148Z" fill="#3d4439" />
          <path d="M80 148H260L324 212H240L80 148Z" fill="#4c5346" />
          <path d="M324 212L212 324H-8L52 264H188L240 212H324Z" fill="#626957" />
          <path d="M128 36H348L338 46H133L31 148H16L128 36Z" fill="#929581" fillOpacity=".5" />
        </g>
      )}
    </svg>
  );
}
