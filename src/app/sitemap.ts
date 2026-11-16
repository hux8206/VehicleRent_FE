import type { MetadataRoute } from "next";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = (
    process.env.NEXT_PUBLIC_APP_URL || "https://vehiclerent.vn"
  ).replace(/\/+$/, "");
  const apiUrl = (
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"
  ).replace(/\/+$/, "");
  const apiEndpoint = apiUrl.endsWith("/api") ? apiUrl : `${apiUrl}/api`;

  const now = new Date();

  // 1. Static public pages (Indexable by search engines)
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${siteUrl}`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${siteUrl}/stores`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/terms`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${siteUrl}/privacy`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${siteUrl}/refund`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${siteUrl}/cookies`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${siteUrl}/feedback`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.4,
    },
  ];

  // 2. Dynamic store routes (/stores/[id])
  let storeRoutes: MetadataRoute.Sitemap = [];
  try {
    const res = await fetch(`${apiEndpoint}/customer/stores`, {
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(4000),
    });
    if (res.ok) {
      const stores = (await res.json()) as Array<{ id: number; updatedAt?: string }>;
      storeRoutes = (stores || []).map((store) => ({
        url: `${siteUrl}/stores/${store.id}`,
        lastModified: store.updatedAt ? new Date(store.updatedAt) : now,
        changeFrequency: "weekly",
        priority: 0.8,
      }));
    }
  } catch {
    storeRoutes = [];
  }

  // 3. Dynamic vehicle routes (/vehicles/[id])
  let vehicleRoutes: MetadataRoute.Sitemap = [];
  try {
    const tomorrow = new Date(Date.now() + 86400000).toISOString();
    const dayAfter = new Date(Date.now() + 2 * 86400000).toISOString();
    const res = await fetch(
      `${apiEndpoint}/customer/vehicles/search?startTime=${encodeURIComponent(
        tomorrow
      )}&endTime=${encodeURIComponent(dayAfter)}`,
      {
        next: { revalidate: 3600 },
        signal: AbortSignal.timeout(4000),
      }
    );
    if (res.ok) {
      const json = await res.json();
      const vehicles = (json.data || []) as Array<{ id: number; updatedAt?: string }>;
      vehicleRoutes = (vehicles || []).map((v) => ({
        url: `${siteUrl}/vehicles/${v.id}`,
        lastModified: v.updatedAt ? new Date(v.updatedAt) : now,
        changeFrequency: "daily",
        priority: 0.8,
      }));
    }
  } catch {
    vehicleRoutes = [];
  }

  return [...staticRoutes, ...storeRoutes, ...vehicleRoutes];
}

