import React from "react";

export function badgeStyle(colorBase, colorAccent) {
  const accent = colorAccent || colorBase;
  return {
    background: accent !== colorBase
      ? `linear-gradient(135deg, ${colorBase}, ${accent})`
      : colorBase,
    boxShadow: `0 2px 10px ${accent}50`,
  };
}

export function Badge({ name, colorBase, colorAccent, dim = false, size = "md" }) {
  const px = size === "sm" ? "px-2.5 py-0.5 text-xs" : "px-3 py-1.5 text-sm";
  return (
    <span
      className={`inline-block rounded-full font-bold text-white m-1 transition-all duration-300 ${px} ${
        dim ? "opacity-25 saturate-0" : ""
      }`}
      style={dim ? { backgroundColor: colorBase } : badgeStyle(colorBase, colorAccent)}
    >
      {name}
    </span>
  );
}
