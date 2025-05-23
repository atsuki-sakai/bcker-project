import React from "react";
import { Loader } from "lucide-react";

// よりスムーズなテキストアニメーションのためのCSS
const loadingTextAnimation = `
  @keyframes textPulse {
    0% { opacity: 0.3; }
    50% { opacity: 1; }
    100% { opacity: 0.3; }
  }

  .loading-text span {
    display: inline-block;
    animation: textPulse 1.8s infinite ease-in-out;
  }
`;

export default function Loading() {
  // 各文字に遅延をつけてアニメーションさせる
  const letters = "LOADING".split("");

  return (
    <div className="flex h-[calc(100vh-20vh)] w-full items-center justify-center">
      <style>{loadingTextAnimation}</style>

      <div className="flex flex-col items-center space-y-4">
        <Loader className="h-10 w-10 md:h-12 md:w-12 text-button animate-spin" />

        <p className="loading-text text-muted-foreground font-medium tracking-widest text-xs md:text-sm scale-75 -translate-y-2">
          {letters.map((letter, index) => (
            <span
              key={index}
              style={{
                animationDelay: `${index * 0.15}s`,
                opacity: 0.3,
              }}
            >
              {letter}
            </span>
          ))}
        </p>
      </div>
    </div>
  )
}
