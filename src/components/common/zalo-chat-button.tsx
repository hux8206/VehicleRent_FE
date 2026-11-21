"use client";

import React from "react";

export function ZaloIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle cx="24" cy="24" r="22" fill="#0068FF" />
      <path
        d="M24 10C16.268 10 10 15.602 10 22.5c0 3.982 2.08 7.518 5.343 9.854-.319 1.978-1.222 4.54-1.764 5.91a.7.7 0 0 0 .88.918c2.894-1.052 5.847-2.485 7.522-3.382A16.03 16.03 0 0 0 24 35c7.732 0 14-5.602 14-12.5S31.732 10 24 10Z"
        fill="#ffffff"
      />
      <path
        d="M17.5 17.5h11c.828 0 1.5.672 1.5 1.5 0 .393-.153.77-.428 1.05L21.7 28H28.5a1.5 1.5 0 0 1 0 3h-11c-.828 0-1.5-.672-1.5-1.5 0-.393.153-.77.428-1.05L24.3 20.5H17.5a1.5 1.5 0 0 1 0-3Z"
        fill="#0068FF"
      />
    </svg>
  );
}

interface ZaloChatButtonProps {
  phone?: string | null;
  label?: string;
  subLabel?: string;
  variant?: "pill" | "banner" | "compact" | "outline" | "floating";
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function ZaloChatButton({
  phone,
  label = "Chat Zalo",
  subLabel,
  variant = "pill",
  size = "md",
  className = "",
}: ZaloChatButtonProps) {
  const cleanPhone = (phone || "").replace(/\D/g, "");

  if (!cleanPhone) {
    return null;
  }

  const zaloUrl = `https://zalo.me/${cleanPhone}`;

  if (variant === "floating") {
    return (
      <a
        href={zaloUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Chat Zalo với cửa hàng qua số ${phone}`}
        className={`inline-flex items-center justify-center bg-[#0068FF] hover:bg-[#0054cc] active:bg-[#0047b3] text-white font-bold rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 h-11 w-11 sm:h-12 sm:w-auto sm:px-4 sm:py-2.5 gap-2 shrink-0 ${className}`}
      >
        <ZaloIcon className="h-5 w-5 shrink-0" />
        <span className="hidden sm:inline text-xs font-bold whitespace-nowrap">{label}</span>
      </a>
    );
  }

  if (variant === "banner") {
    return (
      <a
        href={zaloUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Chat Zalo với cửa hàng qua số ${phone}`}
        className={`inline-flex items-center gap-3 bg-[#0068FF] hover:bg-[#0054cc] active:bg-[#0047b3] text-white font-bold rounded-2xl px-4 py-2.5 transition-all duration-150 shadow-md hover:shadow-lg hover:-translate-y-0.5 group shrink-0 ${className}`}
      >
        <div className="h-9 w-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
          <ZaloIcon className="h-6 w-6" />
        </div>
        <div className="text-left leading-tight">
          <div className="text-xs font-bold text-white tracking-wide">{label}</div>
          <div className="text-[11px] text-blue-100 font-medium">{subLabel || phone}</div>
        </div>
      </a>
    );
  }

  if (variant === "outline") {
    return (
      <a
        href={zaloUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Chat Zalo với cửa hàng qua số ${phone}`}
        className={`inline-flex items-center justify-center gap-1.5 border-2 border-[#0068FF] text-[#0068FF] hover:bg-[#0068FF] hover:text-white font-bold rounded-xl px-3 py-1.5 text-xs transition-colors duration-150 shadow-xs ${className}`}
      >
        <ZaloIcon className="h-4 w-4" />
        <span>{label}</span>
      </a>
    );
  }

  if (variant === "compact") {
    return (
      <a
        href={zaloUrl}
        target="_blank"
        rel="noopener noreferrer"
        title={`Chat Zalo: ${phone}`}
        aria-label={`Chat Zalo với cửa hàng qua số ${phone}`}
        className={`inline-flex items-center gap-1.5 bg-[#0068FF] hover:bg-[#0054cc] text-white font-bold rounded-lg px-2.5 py-1 text-xs transition-colors shadow-xs ${className}`}
      >
        <ZaloIcon className="h-3.5 w-3.5" />
        <span>{label}</span>
      </a>
    );
  }

  // Default "pill"
  const sizeClasses =
    size === "sm"
      ? "px-3 py-1 text-xs gap-1.5"
      : size === "lg"
        ? "px-5 py-2.5 text-sm gap-2.5"
        : "px-3.5 py-1.5 text-xs gap-2";

  return (
    <a
      href={zaloUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Chat Zalo với cửa hàng qua số ${phone}`}
      className={`inline-flex items-center justify-center bg-[#0068FF] hover:bg-[#0054cc] active:bg-[#0047b3] text-white font-bold rounded-full shadow-xs hover:shadow-md hover:-translate-y-0.25 transition-all duration-150 ${sizeClasses} ${className}`}
    >
      <ZaloIcon className={size === "lg" ? "h-5 w-5" : "h-4 w-4"} />
      <span>{label}</span>
    </a>
  );
}

