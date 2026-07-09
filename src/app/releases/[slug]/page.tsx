import type { Metadata } from "next";
import { notFound } from "next/navigation";
import NavBar from "@/components/NavBar/NavBar";
import { getReleaseById, releases } from "@/data/releases";
import ReleaseView from "./ReleaseView";

interface ReleasePageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return releases.map((release) => ({ slug: release.id }));
}

export async function generateMetadata({
  params,
}: ReleasePageProps): Promise<Metadata> {
  const { slug } = await params;
  const release = getReleaseById(slug);

  if (!release) {
    return {};
  }

  return {
    title: release.title,
    description: release.description,
    openGraph: {
      title: release.title,
      description: release.description,
      type: "music.album",
      url: `/releases/${release.id}`,
      images: [{ url: release.coverArt, alt: `${release.title} cover art` }],
    },
    twitter: {
      card: "summary_large_image",
      title: release.title,
      description: release.description,
      images: [release.coverArt],
    },
  };
}

export default async function ReleasePage({ params }: ReleasePageProps) {
  const { slug } = await params;
  const release = getReleaseById(slug);

  if (!release) {
    notFound();
  }

  return (
    <>
      <NavBar />
      <ReleaseView release={release} />
    </>
  );
}
