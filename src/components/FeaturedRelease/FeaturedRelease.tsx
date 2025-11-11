"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Release } from "@/types";
import styles from "./FeaturedRelease.module.css";

interface FeaturedReleaseProps {
  release: Release;
}

const FeaturedRelease: React.FC<FeaturedReleaseProps> = ({ release }) => {
  return (
    <Link href={`/releases/${release.id}`} className={styles.featuredRelease}>
      <div className={styles.coverArtWrapper}>
        <Image
          src={release.coverArt}
          alt={`${release.title} cover art`}
          width={400}
          height={400}
          className={styles.coverArt}
          priority
        />
      </div>
      <div className={styles.releaseInfo}>
        <h2 className={styles.releaseTitle}>{release.title}</h2>
        {release.description && (
          <p className={styles.releaseDescription}>{release.description}</p>
        )}
        <span className={styles.listenNow}>Listen Now →</span>
      </div>
    </Link>
  );
};

export default FeaturedRelease;
