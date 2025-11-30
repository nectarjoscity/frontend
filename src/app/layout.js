import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "./providers";

const GeistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const GeistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://nectarv.com'),
  title: {
    default: "Nectar - Discover Amazing Dining Experiences",
    template: "%s | Nectar"
  },
  description: "Nectar Restaurant - Browse our menu, order your favorites, and enjoy fresh, delicious meals. Pre-order for pickup or delivery. Experience amazing dining in Jos, Plateau State, Nigeria.",
  keywords: ["restaurant", "food delivery", "Jos restaurant", "Plateau State restaurant", "online ordering", "Nectar", "dining", "takeout", "pre-order"],
  authors: [{ name: "Nectar Restaurant" }],
  creator: "Nectar Restaurant",
  publisher: "Nectar Restaurant",
  applicationName: "Nectar Restaurant",
  referrer: "origin-when-cross-origin",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
  },
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F59E0B" },
    { media: "(prefers-color-scheme: dark)", color: "#F59E0B" },
  ],
  openGraph: {
    type: "website",
    locale: "en_NG",
    url: "/",
    siteName: "Nectar",
    title: "Nectar - Discover Amazing Dining Experiences",
    description: "Browse our menu, order your favorites, and enjoy fresh, delicious meals. Pre-order for pickup or delivery.",
    images: [
      {
        url: "/logo_black.svg",
        width: 1200,
        height: 630,
        alt: "Nectar Restaurant Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Nectar - Discover Amazing Dining Experiences",
    description: "Browse our menu, order your favorites, and enjoy fresh, delicious meals.",
    images: ["/logo_black.svg"],
    creator: "@nectarv",
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
  icons: {
    icon: [
      { url: "/logo_black.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/logo_black.svg", type: "image/svg+xml" },
    ],
  },
  manifest: "/manifest.json",
  alternates: {
    canonical: "/",
  },
  other: {
    "geo.region": "NG-PL",
    "geo.placename": "Jos, Plateau State, Nigeria",
    "geo.position": "9.8965;8.8583",
    "ICBM": "9.8965, 8.8583",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en-NG" suppressHydrationWarning>
      <body className={`${GeistSans.variable} ${GeistMono.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
