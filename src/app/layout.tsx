import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/layout/AppShell";
import { QueryProvider } from "@/providers/QueryProvider";
import { ThemeProvider } from "@/providers/ThemeProvider";

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
    <html lang="pt-BR" data-style-preset="dark" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var stored = JSON.parse(localStorage.getItem('pw-helper:app:v1') || '{}');
                var preset = stored && stored.state && stored.state.stylePreset ? stored.state.stylePreset : 'dark';
                document.documentElement.dataset.stylePreset = preset;
              } catch {}
            `,
          }}
        />
      </head>
      <body>
        <QueryProvider>
          <ThemeProvider>
            <AppShell>{children}</AppShell>
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
