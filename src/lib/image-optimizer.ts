/**
 * Image Optimization & Cloudinary URL Transformer
 * Automatically injects Next-Gen format (AVIF/WebP), smart compression (q_auto),
 * and responsive dimension bounds (w_..., h_..., c_fill/c_limit).
 * 
 * Prevents clients from downloading multi-MB raw camera photos directly from Cloudinary.
 */

export interface ImageOptimizeOptions {
  width?: number;
  height?: number;
  quality?: string | number; // e.g. "auto", "auto:good", "auto:eco", 80
  format?: string; // "auto" (AVIF / WebP)
  crop?: "fill" | "limit" | "scale" | "fit" | "thumb" | "pad";
  fallback?: string;
}

export const DEFAULT_VEHICLE_IMAGE =
  "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=800&q=80";

export const DEFAULT_STORE_IMAGE =
  "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80";

/**
 * Optimizes image URLs from Cloudinary or Unsplash.
 * Automatically injects f_auto, q_auto, width, height, and cropping parameters.
 */
export function getOptimizedImageUrl(
  url?: string | null,
  options: ImageOptimizeOptions = {}
): string {
  if (!url || typeof url !== "string" || !url.trim()) {
    return options.fallback || DEFAULT_VEHICLE_IMAGE;
  }

  const trimmed = url.trim();

  // Keep Data URIs, Blobs, SVGs and local assets untouched
  if (
    trimmed.startsWith("data:") ||
    trimmed.startsWith("blob:") ||
    trimmed.endsWith(".svg") ||
    trimmed.includes(".svg?") ||
    trimmed.startsWith("/images/")
  ) {
    return trimmed;
  }

  const {
    width,
    height,
    quality = "auto",
    format = "auto",
    crop,
  } = options;

  const determinedCrop = crop || (width && height ? "fill" : "limit");

  // 1. Cloudinary optimization
  if (trimmed.includes("res.cloudinary.com") && trimmed.includes("/upload/")) {
    const parts = trimmed.split("/upload/");
    if (parts.length === 2) {
      const prefix = parts[0] + "/upload";
      let rest = parts[1];

      const transforms: string[] = [];
      if (format) transforms.push(`f_${format}`);
      if (quality) transforms.push(`q_${quality}`);
      if (width) transforms.push(`w_${width}`);
      if (height) transforms.push(`h_${height}`);
      if (determinedCrop) transforms.push(`c_${determinedCrop}`);

      const transformStr = transforms.join(",");

      // Check if rest already starts with transformation segment
      const firstSlashIdx = rest.indexOf("/");
      if (firstSlashIdx !== -1) {
        const firstSegment = rest.substring(0, firstSlashIdx);
        const isVersion = /^v\d+$/.test(firstSegment);
        if (!isVersion && /(?:[fqwc]_[^,\/]+)/.test(firstSegment)) {
          rest = rest.substring(firstSlashIdx + 1);
        }
      }

      return `${prefix}/${transformStr}/${rest}`;
    }
  }

  // 2. Unsplash optimization
  if (trimmed.includes("images.unsplash.com")) {
    try {
      const parsed = new URL(trimmed);
      parsed.searchParams.set("auto", "format");
      if (quality) parsed.searchParams.set("q", typeof quality === "number" ? String(quality) : "80");
      if (width) parsed.searchParams.set("w", String(width));
      if (height) parsed.searchParams.set("h", String(height));
      if (determinedCrop) parsed.searchParams.set("fit", determinedCrop === "fill" ? "crop" : "max");
      return parsed.toString();
    } catch {
      return trimmed;
    }
  }

  return trimmed;
}

// Preset helpers for easy and consistent usage across the app
export function getVehicleCardImageUrl(url?: string | null): string {
  return getOptimizedImageUrl(url, {
    width: 600,
    height: 400,
    crop: "fill",
    fallback: DEFAULT_VEHICLE_IMAGE,
  });
}

export function getVehicleDetailImageUrl(url?: string | null): string {
  return getOptimizedImageUrl(url, {
    width: 1000,
    height: 600,
    crop: "fill",
    fallback: DEFAULT_VEHICLE_IMAGE,
  });
}

export function getVehicleThumbnailUrl(url?: string | null): string {
  return getOptimizedImageUrl(url, {
    width: 240,
    height: 160,
    crop: "fill",
    fallback: DEFAULT_VEHICLE_IMAGE,
  });
}

export function getStoreCardImageUrl(url?: string | null): string {
  return getOptimizedImageUrl(url, {
    width: 600,
    height: 360,
    crop: "fill",
    fallback: DEFAULT_STORE_IMAGE,
  });
}

export function getStoreBannerImageUrl(url?: string | null): string {
  return getOptimizedImageUrl(url, {
    width: 1200,
    height: 480,
    crop: "fill",
    fallback: DEFAULT_STORE_IMAGE,
  });
}

