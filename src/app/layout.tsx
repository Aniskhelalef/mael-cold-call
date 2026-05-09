import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cold Call of Duty — Mael's Dashboard",
  description: "Gamified cold calling dashboard for Mael",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-game-bg min-h-screen game-bg-pattern">{children}</body>
    </html>
  );
}
