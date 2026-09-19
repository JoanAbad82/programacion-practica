import type { Metadata } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/layout/site-header";

export const metadata: Metadata = {
  title: "Programación Práctica — Proyecto provisional",
  description: "Aprendizaje práctico de Python y PowerShell.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body>
        <SiteHeader />
        <main className="shell">{children}</main>
      </body>
    </html>
  );
}
