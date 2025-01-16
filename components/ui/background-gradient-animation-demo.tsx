"use client";

import { BackgroundGradientAnimation } from "./background-gradient-animation";

export function BackgroundGradientAnimationDemo() {
  return (
    <BackgroundGradientAnimation>
      <div className="absolute z-50 flex flex-col items-center px-4 py-8">
        <h1 className="text-4xl md:text-7xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-b from-neutral-50 to-neutral-400">
          Vision V01
        </h1>
        <p className="mt-4 font-normal text-base md:text-lg text-neutral-300 max-w-lg text-center mx-auto">
          A powerful vision analysis tool that helps you understand and analyze images and video frames in real-time.
        </p>
      </div>
    </BackgroundGradientAnimation>
  );
} 