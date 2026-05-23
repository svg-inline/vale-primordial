import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/layout/AppShell";

export const metadata: Metadata = {
  title: {
    default: "PERFECT WORLD VALE PRIMORDIAL",
    template: "%s | PERFECT WORLD VALE PRIMORDIAL",
  },
  description: "Helper de consultas e calculadoras para Perfect World Vale Primordial.",
  icons: {
    icon: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" data-style-preset="dark">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
