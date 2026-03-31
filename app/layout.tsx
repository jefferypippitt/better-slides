import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ViewTransitions } from "next-view-transitions";

import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const fontSans = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
});

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.better-slides.com"),
  manifest: "/manifest.json",
  title: {
    default: "Better Slides",
    template: "%s | Better Slides",
  },
  description:
    "Build polished presentations in Markdown, embed live React widgets, and deliver with synced speaker notes on your phone.",
  icons: {
    icon: [
      { url: "/icon1.png", type: "image/png" },
      { url: "/icon0.svg", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.ico",
    apple: "/apple-icon.png",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://www.better-slides.com",
    siteName: "Better Slides",
    title: "Better Slides — MDX Presentation Builder",
    description:
      "Build polished presentations in Markdown, embed live React widgets, and deliver with synced speaker notes on your phone.",
    images: [
      {
        url: "/better-slides-logo.png",
        width: 4096,
        height: 4096,
        alt: "Better Slides",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "Better Slides — MDX Presentation Builder",
    description:
      "Build polished presentations in Markdown, embed live React widgets, and deliver with synced speaker notes on your phone.",
    images: ["/better-slides-logo.png"],
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
  appleWebApp: {
    capable: true,
    title: "Better Slides",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#171717" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ViewTransitions>
      <html
        className={cn(
          "antialiased",
          fontMono.variable,
          "font-sans",
          fontSans.variable
        )}
        lang="en"
        suppressHydrationWarning
      >
        <body>
          <ThemeProvider>
            <TooltipProvider>{children}</TooltipProvider>
            <Toaster />
          </ThemeProvider>
        </body>
      </html>
    </ViewTransitions>
  );
}
