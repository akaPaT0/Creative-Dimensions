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
        // browser blocked autoplay before interaction
      }
    };

    const handleFirstInteraction = () => {
      playAudio();
    };

    window.addEventListener("click", handleFirstInteraction, { once: true });
    window.addEventListener("touchstart", handleFirstInteraction, { once: true });

    playAudio();

    return () => {
      window.removeEventListener("click", handleFirstInteraction);
      window.removeEventListener("touchstart", handleFirstInteraction);
    };
  }, []);

  return (
    <audio ref={audioRef} loop preload="auto">
      <source src="/music/bgMusic.mp3" type="audio/mpeg" />
    </audio>
  );
}