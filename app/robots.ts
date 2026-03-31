import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/write", "/present/", "/api/"],
    },
    sitemap: "https://www.better-slides.com/sitemap.xml",
  };
}
