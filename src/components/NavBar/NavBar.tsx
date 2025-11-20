"use client";

import React from "react";
import Link from "next/link";
import styles from "./NavBar.module.css";

const NavBar: React.FC = () => {
  return (
    <div className={styles.navBar}>
      <div className={styles.title}>Ben Doggett</div>
      <div className={styles.linkList}>
        <Link href="/" className={styles.link}>
          Home
        </Link>
        <Link href="/releases" className={styles.link}>
          Music
        </Link>
        <Link href="/story" className={styles.link}>
          Story
        </Link>
      </div>
    </div>
  );
};

export default NavBar;
