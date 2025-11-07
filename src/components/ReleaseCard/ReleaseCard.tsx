"use client";

import Image from "next/image";
import { ReleaseCardProps } from "@/types";
import styles from "./ReleaseCard.module.css";

export default function ReleaseCard({ release }: ReleaseCardProps) {
  return (
    <div
      className={styles.ReleaseCard}
      aria-label={`View ${release.title} ${release.type}`}
    >
      <Image
        src={release.coverArt}
        alt={`${release.title} release cover`}
        fill
        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
        // className={styles.coverImage}
        priority={false}
      />
    </div>
  );
}
