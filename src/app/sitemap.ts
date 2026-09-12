import type { MetadataRoute } from "next";

import { navigation, siteConfig } from "@/lib/site-config";

/**
 * Sitemap, generated from the same navigation array the header renders, so a new
 * page can never be added to the site and forgotten here.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return navigation.map((item) => ({
    url: new URL(item.href, siteConfig.url).toString(),
    lastModified,
    changeFrequency: item.href === "/" ? "monthly" : "yearly",
    priority: item.href === "/" ? 1 : 0.7,
  }));
}
