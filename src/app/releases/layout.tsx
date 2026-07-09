import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Releases",
    template: "%s | Ben Doggett",
  },
  description:
    "Explore worship music by Ben Doggett — songs exploring faith, worship, and the depths of God's love. Listen to EPs, singles, and worship songs.",
  keywords: [
    "Ben Doggett",
    "worship music",
    "christian music",
    "faith",
    "releases",
    "EPs",
    "singles",
  ],
  openGraph: {
    title: "Releases | Ben Doggett",
    description:
      "Explore worship music by Ben Doggett — songs exploring faith, worship, and the depths of God's love.",
    type: "website",
    url: "/releases",
  },
  twitter: {
    card: "summary_large_image",
    title: "Releases | Ben Doggett",
    description:
      "Explore worship music by Ben Doggett — songs exploring faith, worship, and the depths of God's love.",
  },
};

export default function ReleasesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
