import type { Metadata } from "next";
import { Cormorant_Garamond, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import SmoothScroll from "@/components/animations/SmoothScroll";
import PagePreloader from "@/components/PagePreloader";
// import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";

const cormorant = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "indian.rent | Direct Rental Marketplace by WishLabs",
  description: "Bypass brokers, find your next home directly in Hyderabad and across India. A product of WishLabs.",
  manifest: "/manifest.json",
  openGraph: {
    title: "indian.rent | Direct Rental Marketplace by WishLabs",
    description: "Bypass brokers, find your next home directly in Hyderabad and across India. A product of WishLabs.",
    url: "https://indian.rent",
    siteName: "indian.rent",
    images: [{ url: "https://indian.rent/og-image.png", width: 1200, height: 630, alt: "indian.rent" }],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "indian.rent — No Broker, No Bullshit",
    description: "Find verified rentals without broker fees.",
    images: ["https://indian.rent/og-image.png"],
  },
};

import { ThemeProvider } from "@/components/ThemeProvider";
import { ToastProvider } from "@/providers/ToastProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${cormorant.variable} ${inter.variable} ${jetbrainsMono.variable} antialiased`}
      style={{ scrollBehavior: 'auto' }}
      data-map-provider="google"
    >
      <head>
        <meta name="theme-color" content="#ff6b35" />
        <link rel="icon" href="/ir.ico" type="image/x-icon" />
        <link rel="icon" href="/ir.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/ir.svg" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        />
      </head>
      <body className="bg-background text-on-background overflow-y-scroll">
        <PagePreloader />
        <ThemeProvider>
          <ToastProvider>
            <SmoothScroll>
              {children}
            </SmoothScroll>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
