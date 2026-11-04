export const siteDescription = "Siona Group is focused on people, technology, and the future of healthcare. The path is the way.";

export function getSiteUrl(): URL | undefined {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  const vercelDomain = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  const value = configured || (vercelDomain ? `https://${vercelDomain}` : undefined);
  if (!value) return undefined;
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) ? url : undefined;
  } catch {
    return undefined;
  }
}
