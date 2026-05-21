import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Inter, JetBrains_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
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
  metadataBase: new URL('https://indian.rent'),
  title: "indian.rent | Direct Rental Marketplace by WishLabs",
  description: "Bypass brokers, find your next home directly in Hyderabad and across India. A product of WishLabs.",
  manifest: "/manifest.json",
  openGraph: {
    title: "indian.rent | Direct Rental Marketplace by WishLabs",
    description: "Bypass brokers, find your next home directly in Hyderabad and across India. A product of WishLabs.",
    url: "https://indian.rent",
    siteName: "indian.rent",
    images: [{ url: "https://indian.rent/og-image", width: 1200, height: 630, alt: "indian.rent" }],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "indian.rent — No Broker, No Bullshit",
    description: "Find verified rentals without broker fees.",
    images: ["https://indian.rent/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
    },
  },
};

export const viewport: Viewport = {
  themeColor: '#ff6b35',
  width: 'device-width',
  initialScale: 1,
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
      lang="en-IN"
      className={`${cormorant.variable} ${inter.variable} ${jetbrainsMono.variable} antialiased`}
      style={{ scrollBehavior: 'auto' }}
      data-map-provider="google"
    >
      <head>
        <link rel="icon" href="/ir.ico" type="image/x-icon" />
        <link rel="icon" href="/ir.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link
          rel="preload"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          as="style"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "indian.rent",
              "url": "https://indian.rent",
              "description": "Direct Rental Marketplace by WishLabs",
              "potentialAction": {
                "@type": "SearchAction",
                "target": {
                  "@type": "EntryPoint",
                  "urlTemplate": "https://indian.rent/explore?search={search_term_string}"
                },
                "query-input": "required name=search_term_string"
              }
            })
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "indian.rent",
              "url": "https://indian.rent",
              "logo": "https://indian.rent/ir.svg",
              "description": "Direct Rental Marketplace - Bypass brokers, find your next home directly in Hyderabad and across India.",
              "sameAs": [
                "https://twitter.com/indianrentapp",
                "https://instagram.com/indianrentapp"
              ],
              "contactPoint": {
                "@type": "ContactPoint",
                "telephone": "+91-XXXXXXXXXX",
                "contactType": "Customer Support",
                "email": "support@wishlabs.in"
              }
            })
          }}
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
        <Analytics />
      </body>
    </html>
  );
}
