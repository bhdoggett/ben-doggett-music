"use client";

import React from "react";
import { Release } from "@/types";
import { SongList } from "@/components/SongList";
import styles from "./ReleaseLayouts.module.css";

interface EPLayoutProps {
  release: Release;
}

export const EPLayout: React.FC<EPLayoutProps> = ({ release }) => {
  return (
    // <div className={styles.epLayout}>
    <SongList songs={release.songs} release={release} />
    // </div>
  );
};

export default EPLayout;
