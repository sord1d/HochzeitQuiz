import React from "react";

export function badgeStyle(colorBase, colorAccent) {
  const accent = colorAccent || colorBase;
  return {
    background: accent !== colorBase
      ? `linear-gradient(135deg, ${colorBase}, ${accent})`
      : colorBase,
    boxShadow: `0 2px 12px ${accent}60`,
  };
}

export function Badge({ name, colorBase, colorAccent, dim = false, size = "md", index = 0 }) {
  const sizeClass = {
    xs: "px-2 py-0.5 text-xs",
    sm: "px-2.5 py-1 text-xs",
    md: "px-3 py-1.5 text-sm",
    lg: "px-4 py-2 text-base",
  }[size] ?? "px-3 py-1.5 text-sm";

  return (
    <span
      className={`inline-block rounded-full font-bold text-white m-1 animate-fade-in ${sizeClass} ${
        dim ? "opacity-25 saturate-0" : ""
      }`}
      style={{
        animationDelay: `${index * 60}ms`,
        animationFillMode: "both",
        ...(dim ? { backgroundColor: colorBase } : badgeStyle(colorBase, colorAccent)),
      }}
    >
      {name}
    </span>
  );
}
