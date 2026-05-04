import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/u/"],
        disallow: ["/me/", "/onboarding/", "/admin/", "/auth/", "/api/"],
      },
    ],
    sitemap: "https://jpop.ernebi.org/sitemap.xml",
  };
}
