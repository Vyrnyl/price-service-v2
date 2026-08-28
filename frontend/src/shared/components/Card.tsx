import type { HTMLAttributes, ReactNode } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export default function Card({ className = "", children, ...rest }: CardProps) {
  return (
    <div
      className={`rounded-xl border border-outline-variant bg-surface-container-lowest data-card-shadow ${className}`.trim()}
      {...rest}
    >
      {children}
    </div>
  );
}
