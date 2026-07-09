import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AudioProvider } from "@/contexts/AudioContext";
import { GlobalAudioPlayer } from "@/components/GlobalAudioPlayer";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Ben Doggett | Worship Music & Faith",
    template: "%s | Ben Doggett",
  },
  description:
    "Original worship music by Ben Doggett exploring faith, worship, and the depths of God's love. Listen to worship songs, EPs, and singles.",

  keywords: [
    "Ben Doggett",
    "worship music",
    "christian music",
    "faith",
    "releases",
    "EPs",
    "singles",
  ],
  authors: [{ name: "Ben Doggett" }],
  creator: "Ben Doggett",
  openGraph: {
    type: "website",
    locale: "en_US",
    title: "Ben Doggett | Worship Music & Faith",
    description:
      "Original worship music by Ben Doggett exploring faith, worship, and the depths of God's love.",
    siteName: "Ben Doggett",
  },
  twitter: {
    card: "summary_large_image",
    title: "Ben Doggett | Worship Music & Faith",
    description:
      "Original worship music by Ben Doggett exploring faith, worship, and the depths of God's love.",
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

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Momo+Trust+Display&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <AudioProvider>
          {children}
          <GlobalAudioPlayer />
        </AudioProvider>
      </body>
    </html>
  );
}
