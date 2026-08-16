import type { Metadata } from "next";
import "./globals.css";
import ClientAppShell from "../shared/components/ClientAppShell";
import { ToastProvider } from "../shared/components/Toast";

export const metadata: Metadata = {
  title: "PresyoSerbisyo",
  description: "Market monitoring dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      </head>
      <body className="min-h-full flex flex-col bg-background text-on-surface">
        <ToastProvider>
          <ClientAppShell>{children}</ClientAppShell>
        </ToastProvider>
      </body>
    </html>
  );
}
