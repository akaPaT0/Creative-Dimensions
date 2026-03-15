"use client";

import { useEffect, useRef } from "react";

export default function BackgroundMusic() {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = 0.2;

    const playAudio = async () => {
      try {
        await audio.play();
      } catch {
        // autoplay may be blocked until user interacts
      }
    };

    playAudio();
  }, []);

  return (
    <audio ref={audioRef} loop>
      <source src="/music/bgMusic.mp3" type="audio/mpeg" />
    </audio>
  );
}