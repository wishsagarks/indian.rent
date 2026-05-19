import type { Metadata } from "next";
import { Geist, Geist_Mono, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import SmoothScroll from "@/components/animations/SmoothScroll";
// import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "indian.rent — No Broker, No Bullshit",
  description: "Find verified rentals in Hyderabad & Bengaluru without broker fees. Direct from owners & residents.",
  manifest: "/manifest.json",
  openGraph: {
    title: "indian.rent — No Broker, No Bullshit",
    description: "Find verified rentals in Hyderabad & Bengaluru without broker fees.",
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${jetbrainsMono.variable} antialiased dark`}
      style={{ scrollBehavior: 'auto' }}
      data-map-provider="google"
    >
      <head>
        <meta name="theme-color" content="#0066ff" />
        <link rel="apple-touch-icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 180 180'><rect fill='%230066ff' width='180' height='180'/><text x='90' y='90' font-size='100' font-family='Arial,sans-serif' font-weight='bold' fill='white' text-anchor='middle' dominant-baseline='central'>ir</text></svg>" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        />
      </head>
      <body className="bg-background text-on-background overflow-y-scroll">
        <SmoothScroll>
          {children}
        </SmoothScroll>
      </body>
    </html>
  );
}
