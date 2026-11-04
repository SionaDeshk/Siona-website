# SIONA visual assets

The local metallic ribbon S and layered onyx images were reconstructed from the LinkedIn company-page screenshot supplied for the visual refresh. They are reference-based raster restorations, not the original production logo or a vector master. The S preserves the reference's curved ribbon construction, graphite faces, champagne undersides, and tapered terminals.

- `siona-symbol.webp`: transparent, shared brand symbol; used at responsive sizes through Next.js Image.
- `onyx.webp`: landscape ivory, sandstone, champagne, and sage hero texture.
- `onyx-mobile.webp`: portrait crop for mobile art direction; only the matching CSS background is downloaded.

The favicon, app icon, Apple icon, and Open Graph image use this same symbol. The social renderer embeds JPEG/PNG counterparts from `src/assets/brand/` because its image decoder does not support WebP; those files are not requested by the homepage. No LinkedIn interface, employee count, follower count, address, or category text is included in the site. Assets are served locally; no remote image domains or new dependencies are required.

If an original high-resolution logo becomes available, replace the symbol while preserving its proportions, then regenerate the favicon/app icons. Retain a transparent background for the symbol. Homepage wording and the contact endpoint are independent of these assets.
