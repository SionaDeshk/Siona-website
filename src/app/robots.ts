import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  const url = getSiteUrl();
  return {
    rules: { userAgent: "*", allow: "/", disallow: "/api/" },
    ...(url ? { sitemap: new URL("/sitemap.xml", url).toString() } : {}),
  };
}
