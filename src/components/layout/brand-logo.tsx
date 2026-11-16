"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";

interface BrandLogoProps {
  href?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
  variant?: "auto" | "light" | "dark";
  roleBadge?: "ADMIN PORTAL" | "PARTNER PORTAL" | null;
  priority?: boolean;
}

export function BrandLogo({
  href,
  className = "",
  size = "md",
  variant = "auto",
  roleBadge,
  priority = true,
}: BrandLogoProps) {
  // Size variants
  // Original aspect ratio: 657 x 133 ≈ 4.94 : 1
  const dimensions = {
    sm: { width: 138, height: 28, imgClass: "h-6 sm:h-7", textClass: "text-[9px]" },
    md: { width: 158, height: 32, imgClass: "h-7 sm:h-8", textClass: "text-[10px]" },
    lg: { width: 188, height: 38, imgClass: "h-8 sm:h-9", textClass: "text-[11px]" },
  }[size];

  const logoContent = (
    <div className={`flex flex-col justify-center shrink-0 group ${className}`}>
      <div className="relative flex items-center">
        {/* Render for Light variant or Auto (light mode) */}
        {variant !== "dark" && (
          <Image
            src="/images/logo.png"
            alt="VehicleRent"
            width={dimensions.width}
            height={dimensions.height}
            priority={priority}
            className={`${dimensions.imgClass} w-auto object-contain transition-transform group-hover:scale-[1.02] ${
              variant === "auto" ? "dark:hidden" : ""
            }`}
          />
        )}
        {/* Render for Dark variant or Auto (dark mode) */}
        {variant !== "light" && (
          <Image
            src="/images/logo-dark.png"
            alt="VehicleRent"
            width={dimensions.width}
            height={dimensions.height}
            priority={priority}
            className={`${dimensions.imgClass} w-auto object-contain transition-transform group-hover:scale-[1.02] ${
              variant === "auto" ? "hidden dark:block" : ""
            }`}
          />
        )}
      </div>

      {roleBadge && (
        <span
          className={`mt-0.5 font-extrabold uppercase tracking-widest leading-none ${dimensions.textClass} ${
            roleBadge === "ADMIN PORTAL"
              ? "text-red-600 dark:text-red-400"
              : "text-amber-600 dark:text-amber-400"
          }`}
        >
          {roleBadge}
        </span>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex items-center shrink-0">
        {logoContent}
      </Link>
    );
  }

  return logoContent;
}
