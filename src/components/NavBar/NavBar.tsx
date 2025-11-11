"use client";

import React from "react";
import Link from "next/link";
import styles from "./NavBar.module.css";

const NavBar: React.FC = () => {
  return (
    <div className={styles.navBar}>
      <Link href="/" className={styles.link}>
        Home
      </Link>
      <Link href="/releases" className={styles.link}>
        Music
      </Link>
      <Link href="/story" className={styles.link}>
        Story
      </Link>
      <Link href="/support" className={styles.link}>
        Support
      </Link>
    </div>
  );
};

export default NavBar;
