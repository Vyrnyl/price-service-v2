import type { HTMLAttributes, ReactNode } from "react";

interface PageShellProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode;
}

export default function PageShell({ className = "", children, ...rest }: PageShellProps) {
  return (
    <main className={`min-h-screen lg:ml-72 ${className}`.trim()} {...rest}>
      {children}
    </main>
  );
}
