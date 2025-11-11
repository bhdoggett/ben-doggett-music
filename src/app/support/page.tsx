"use client";

import React from "react";
import NavBar from "../../components/NavBar/NavBar";
import styles from "./page.module.css";
import Link from "next/link";

const StoryPage: React.FC = () => {
  return (
    <div>
      <NavBar />
      <main className={styles.main}>
        <h1 className={styles.header}>
          Thanks for clicking the support link!!!
        </h1>

        <p>
          You may have heard that streaming is brutal for artists. I'm not
          complaining, just saying. As someone who doesn't tour and doesn't sell
          merch, I long ago realized that making, producing and selling music
          would be a joy and not a money-maker. That said, finances <em>DO</em>{" "}
          offer some validation and encouragement. So...
        </p>
        <p>
          The most straighforward way to support me as an artist, if you feel so
          inclined to do so with your dollars, is to head over to my{" "}
          <Link href="https://bendoggett.bandcamp.com/" className={styles.link}>
            bandcamp page
          </Link>{" "}
          and purchase my music like in the old days. You can also{" "}
          <Link
            href="https://bendoggett.bandcamp.com/community"
            className={styles.link}
          >
            follow
          </Link>{" "}
          me there to stay up to date on what I'm up to.
        </p>
      </main>
    </div>
  );
};

export default StoryPage;
