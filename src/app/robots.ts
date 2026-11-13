import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = (
    process.env.NEXT_PUBLIC_APP_URL || "https://vehiclerent.vn"
  ).replace(/\/+$/, "");

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/admin/*",
          "/partner",
          "/partner/*",
          "/profile",
          "/profile/*",
          "/api",
          "/api/*",
          "/auth/*",
        ],
      },
      {
        userAgent: "Googlebot",
        allow: ["/", "/stores", "/stores/*", "/vehicles/*", "/images/*"],
        disallow: [
          "/admin",
          "/admin/*",
          "/partner",
          "/partner/*",
          "/profile",
          "/profile/*",
          "/api",
          "/api/*",
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
