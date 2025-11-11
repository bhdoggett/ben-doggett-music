"use client";

import React, { useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import styles from "./HoverWord.module.css";

interface HoverWordProps {
  children: React.ReactNode;
  image: string;
  alt: string;
  position?: {
    top?: string;
    bottom?: string;
    left?: string;
    right?: string;
  };
  rotation?: number; // degrees
  size?: {
    width?: number;
    height?: number;
  };
}

const HoverWord: React.FC<HoverWordProps> = ({
  children,
  image,
  alt,
  position = { top: "20%", right: "10%" },
  rotation = 0,
  size = { width: 300, height: 300 },
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <>
      <span
        className={styles.hoverWord}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {children}
      </span>

      {isHovered &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className={styles.imageContainer}
            style={{
              ...position,
              transform: `rotate(${rotation}deg)`,
            }}
          >
            <Image
              src={image}
              alt={alt}
              width={size.width}
              height={size.height}
              className={styles.image}
              priority
            />
          </div>,
          document.body
        )}
    </>
  );
};

export default HoverWord;
