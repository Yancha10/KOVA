"use client";
import React from "react";

const ticks = Array.from({ length: 12 }, (_, i) => {
  const a = (i * Math.PI) / 6, r1 = 19.5, r2 = i % 3 === 0 ? 15.5 : 17.5;
  return [32 + r1 * Math.cos(a), 36 + r1 * Math.sin(a), 32 + r2 * Math.cos(a), 36 + r2 * Math.sin(a)];
});

export default function StopwatchIcon() {
  return (
    <svg className="stopwatch" viewBox="0 0 64 64" aria-hidden="true">
      <rect className="sw-crown" x="26" y="1.5" width="12" height="6" rx="2" />
      <rect className="sw-stem" x="29.5" y="7" width="5" height="6" rx="1" />
      <rect className="sw-side" x="47" y="11" width="9" height="5" rx="2" transform="rotate(40 51.5 13.5)" />
      <circle className="sw-body" cx="32" cy="36" r="23" />
      {ticks.map(([x1, y1, x2, y2], i) => (
        <line key={i} className="sw-tick" x1={x1.toFixed(1)} y1={y1.toFixed(1)} x2={x2.toFixed(1)} y2={y2.toFixed(1)} />
      ))}
      <circle className="sw-arc" cx="32" cy="36" r="12.5" />
      <line className="sw-hand" x1="32" y1="36" x2="32" y2="19.5" />
      <circle className="sw-hub" cx="32" cy="36" r="3" />
    </svg>
  );
}
