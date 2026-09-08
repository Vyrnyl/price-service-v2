import type { SVGAttributes } from "react";

export type LogoVariant = "primary" | "inverse" | "mono";

interface LogoProps extends Omit<SVGAttributes<SVGSVGElement>, "viewBox"> {
  size?: number;
  variant?: LogoVariant;
  title?: string;
}

/**
 * PresyoSerbisyo mark — a peso sign above three rising monitoring bars.
 *
 * - `primary` — solid brand-blue tile, white peso, gold leading bar. Default.
 * - `inverse` — white tile for placement on a primary-blue surface.
 * - `mono`    — single-ink outline for print, stamps, and letterhead. Inherits
 *               `currentColor`, so the parent's text color drives it.
 */
export default function Logo({
  size = 28,
  variant = "primary",
  title = "PresyoSerbisyo",
  ...rest
}: LogoProps) {
  const isMono = variant === "mono";
  const tile = variant === "inverse" ? "var(--color-on-primary)" : "var(--color-primary)";
  const ink = variant === "inverse" ? "var(--color-primary)" : "var(--color-on-primary)";
  const lead = variant === "inverse" ? "var(--color-primary)" : "var(--color-secondary-container)";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      role="img"
      aria-label={title}
      {...rest}
    >
      {isMono ? (
        <rect
          x="5.7"
          y="5.7"
          width="52.6"
          height="52.6"
          rx="12.3"
          fill="none"
          stroke="currentColor"
          strokeWidth="3.4"
        />
      ) : (
        <rect x="4" y="4" width="56" height="56" rx="14" fill={tile} />
      )}

      <rect
        x="15"
        y="34"
        width="6.5"
        height="16"
        rx="3.25"
        fill={isMono ? "currentColor" : ink}
        opacity={isMono ? 1 : variant === "inverse" ? 0.4 : 0.5}
      />
      <rect
        x="25.5"
        y="27"
        width="6.5"
        height="23"
        rx="3.25"
        fill={isMono ? "currentColor" : ink}
        opacity={isMono ? 1 : variant === "inverse" ? 0.7 : 0.75}
      />
      <rect
        x="36"
        y="19"
        width="6.5"
        height="31"
        rx="3.25"
        fill={isMono ? "currentColor" : lead}
      />

      <g
        fill="none"
        stroke={isMono ? "currentColor" : ink}
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M13 15.5 H31.5" />
        <path d="M13 22 H31.5" />
        <path d="M18.5 11 V27" />
        <path d="M18.5 11 H26 A5.2 5.2 0 0 1 26 21.4 H18.5" />
      </g>
    </svg>
  );
}
