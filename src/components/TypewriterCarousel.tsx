"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface TypewriterCarouselProps {
  texts: string[];
  typingSpeed?: number;
  deletingSpeed?: number;
  pauseDuration?: number;
  className?: string;
}

export function TypewriterCarousel({
  texts,
  typingSpeed = 80,
  deletingSpeed = 40,
  pauseDuration = 2500,
  className = "",
}: TypewriterCarouselProps) {
  const [displayText, setDisplayText] = useState("");
  const [textIndex, setTextIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showCursor, setShowCursor] = useState(true);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Blinking cursor
  useEffect(() => {
    const interval = setInterval(() => {
      setShowCursor((v) => !v);
    }, 530);
    return () => clearInterval(interval);
  }, []);

  const tick = useCallback(() => {
    if (texts.length === 0) return;
    const currentText = texts[textIndex];

    if (isPaused) {
      timeoutRef.current = setTimeout(() => {
        setIsPaused(false);
        setIsDeleting(true);
      }, pauseDuration);
      return;
    }

    if (!isDeleting) {
      // Typing
      if (charIndex < currentText.length) {
        setDisplayText(currentText.slice(0, charIndex + 1));
        setCharIndex((c) => c + 1);
      } else {
        // Finished typing, pause before deleting
        setIsPaused(true);
      }
    } else {
      // Deleting
      if (charIndex > 0) {
        setDisplayText(currentText.slice(0, charIndex - 1));
        setCharIndex((c) => c - 1);
      } else {
        // Finished deleting, move to next text
        setIsDeleting(false);
        setTextIndex((i) => (i + 1) % texts.length);
      }
    }
  }, [texts, textIndex, charIndex, isDeleting, isPaused, pauseDuration]);

  useEffect(() => {
    const speed = isPaused ? pauseDuration : isDeleting ? deletingSpeed : typingSpeed;
    timeoutRef.current = setTimeout(tick, speed);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [tick, isPaused, isDeleting, typingSpeed, deletingSpeed, pauseDuration]);

  return (
    <span className={className}>
      {displayText}
      <span
        className={`inline-block w-[2px] h-[1em] align-middle ml-0.5 -mb-[1px] transition-opacity duration-100 ${
          showCursor ? "opacity-100" : "opacity-0"
        }`}
        style={{ backgroundColor: "var(--accent)" }}
      />
    </span>
  );
}
