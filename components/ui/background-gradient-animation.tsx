"use client";

import { cn } from "@/lib/utils";

export const BackgroundGradientAnimation = ({
  gradientBackgroundStart = "rgb(108, 0, 162)",
  gradientBackgroundEnd = "rgb(0, 17, 82)",
  firstColor = "18, 113, 255",
  secondColor = "221, 74, 255",
  thirdColor = "100, 220, 255",
  fourthColor = "200, 50, 50",
  fifthColor = "180, 180, 50",
  pointerColor = "140, 100, 255",
  size = "80%",
  blendingValue = "hard-light",
  children,
  className,
  interactive = true,
  containerClassName,
}: {
  gradientBackgroundStart?: string;
  gradientBackgroundEnd?: string;
  firstColor?: string;
  secondColor?: string;
  thirdColor?: string;
  fourthColor?: string;
  fifthColor?: string;
  pointerColor?: string;
  size?: string;
  blendingValue?: string;
  children?: React.ReactNode;
  className?: string;
  interactive?: boolean;
  containerClassName?: string;
}) => {
  return (
    <div
      className={cn(
        "h-screen flex flex-col items-center justify-center",
        containerClassName
      )}
    >
      <div
        className={cn(
          "h-[100vh] w-screen relative flex flex-col items-center justify-center",
          className
        )}
        style={{
          background: `linear-gradient(${gradientBackgroundStart}, ${gradientBackgroundEnd})`,
        }}
      >
        <div
          className="absolute inset-auto h-[60vh] w-[60vw]"
          style={{
            background: `radial-gradient(circle at center, rgba(${firstColor}, 0.8) 0%, rgba(${firstColor}, 0) 100%)`,
            transform: "translate(-50%, -50%)",
            left: "50%",
            top: "50%",
            animation: "first 8s linear infinite",
            mixBlendMode: blendingValue as any,
          }}
        />
        <div
          className="absolute inset-auto h-[60vh] w-[60vw]"
          style={{
            background: `radial-gradient(circle at center, rgba(${secondColor}, 0.8) 0%, rgba(${secondColor}, 0) 100%)`,
            transform: "translate(-50%, -50%)",
            left: "50%",
            top: "50%",
            animation: "second 8s linear infinite",
            mixBlendMode: blendingValue as any,
          }}
        />
        <div
          className="absolute inset-auto h-[60vh] w-[60vw]"
          style={{
            background: `radial-gradient(circle at center, rgba(${thirdColor}, 0.8) 0%, rgba(${thirdColor}, 0) 100%)`,
            transform: "translate(-50%, -50%)",
            left: "50%",
            top: "50%",
            animation: "third 8s linear infinite",
            mixBlendMode: blendingValue as any,
          }}
        />
        <div
          className="absolute inset-auto h-[60vh] w-[60vw]"
          style={{
            background: `radial-gradient(circle at center, rgba(${fourthColor}, 0.8) 0%, rgba(${fourthColor}, 0) 100%)`,
            transform: "translate(-50%, -50%)",
            left: "50%",
            top: "50%",
            animation: "fourth 8s linear infinite",
            mixBlendMode: blendingValue as any,
          }}
        />
        <div
          className="absolute inset-auto h-[60vh] w-[60vw]"
          style={{
            background: `radial-gradient(circle at center, rgba(${fifthColor}, 0.8) 0%, rgba(${fifthColor}, 0) 100%)`,
            transform: "translate(-50%, -50%)",
            left: "50%",
            top: "50%",
            animation: "fifth 8s linear infinite",
            mixBlendMode: blendingValue as any,
          }}
        />
        {children}
      </div>
    </div>
  );
};
