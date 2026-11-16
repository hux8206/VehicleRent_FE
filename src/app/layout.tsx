import type { Metadata } from "next";
import { Suspense } from "react";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/auth-context";
import { ThemeProvider } from "@/context/theme-context";
import { LanguageProvider } from "@/context/language-context";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { CookieConsentBanner } from "@/components/layout/cookie-consent-banner";
import { Toaster } from "sonner";
import { GoogleAnalytics } from "@next/third-parties/google";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin", "vietnamese"],
  variable: "--font-heading",
  weight: ["600", "700", "800"],
  display: "swap",
});

const inter = Inter({
  subsets: ["latin", "vietnamese"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://vehiclerent.vn";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "VehicleRent - Nền Tảng Cho Thuê Xe Trực Tuyến Đa Đối Tác",
    template: "%s | VehicleRent",
  },
  description:
    "Hệ sinh thái cho thuê xe máy, ô tô tự lái uy tín toàn quốc. Giữ chỗ 10 phút chống xung đột, thanh toán VietQR tự động và đối soát 6 điểm kỹ thuật số.",
  keywords: [
    "thuê xe tự lái",
    "thuê xe máy",
    "thuê ô tô",
    "VehicleRent",
    "thuê xe hà nội",
    "thuê xe đà nẵng",
    "thuê xe hồ chí minh",
    "VietQR thuê xe",
  ],
  authors: [{ name: "VehicleRent Team", url: siteUrl }],
  creator: "VehicleRent",
  publisher: "VehicleRent",
  icons: {
    icon: [
      { url: "/images/logo-icon.png", sizes: "any" },
      { url: "/images/logo-icon.png", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: [{ url: "/images/logo-icon.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    title: "VehicleRent - Nền Tảng Cho Thuê Xe Trực Tuyến Đa Đối Tác",
    description:
      "Thuê xe máy, ô tô tự lái đời mới uy tín toàn quốc. Giữ xe 10 phút VietQR tự động, đối soát 6 điểm kỹ thuật số minh bạch.",
    url: siteUrl,
    siteName: "VehicleRent",
    locale: "vi_VN",
    type: "website",
    images: [
      {
        url: "/images/og-banner.png",
        width: 1200,
        height: 630,
        alt: "VehicleRent - Nền Tảng Cho Thuê Xe Trực Tuyến Đa Đối Tác",
      },
      {
        url: "/images/logo.png",
        width: 657,
        height: 133,
        alt: "VehicleRent Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "VehicleRent - Nền Tảng Cho Thuê Xe Trực Tuyến Đa Đối Tác",
    description:
      "Thuê xe máy, ô tô tự lái đời mới uy tín toàn quốc. Giữ xe 10 phút VietQR tự động, đối soát 6 điểm kỹ thuật số minh bạch.",
    images: ["/images/og-banner.png"],
    creator: "@vehiclerent",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;

  return (
    <html lang="vi" suppressHydrationWarning className={`${inter.variable} ${plusJakartaSans.variable}`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');var m=window.matchMedia('(prefers-color-scheme: dark)').matches;if(t==='dark'||(!t&&m)||(t==='system'&&m)){document.documentElement.classList.add('dark');document.documentElement.style.colorScheme='dark';}else{document.documentElement.classList.remove('dark');document.documentElement.style.colorScheme='light';}var l=localStorage.getItem('vr_locale');if(l){document.documentElement.lang=l;}}catch(e){}})()`,
          }}
        />
      </head>
      <body className="min-h-screen flex flex-col antialiased bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 font-sans transition-colors duration-200" suppressHydrationWarning>
        <ThemeProvider>
          <LanguageProvider>
            <AuthProvider>
              <Suspense fallback={<div className="h-16 border-b bg-white dark:bg-slate-900 dark:border-slate-800" />}>
                <Navbar />
              </Suspense>
              <main className="flex-1">{children}</main>
              <Footer />
              <CookieConsentBanner />
              <Toaster richColors position="top-right" />
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
        {gaId && <GoogleAnalytics gaId={gaId} />}
      </body>
    </html>
  );
}
