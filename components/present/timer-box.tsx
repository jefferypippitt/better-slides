"use client";

import { useEffect, useState } from "react";

export function TimerBox() {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const display = `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

  return (
    <div className="flex h-full w-full items-center justify-center font-mono text-[clamp(1rem,3cqw,2rem)]">
      {display}
    </div>
  );
}
