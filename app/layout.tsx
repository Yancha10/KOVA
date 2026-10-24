import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "KOVA | Tu entrenamiento evoluciona contigo",
  description: "Planifica, entrena y descubre tu progreso. Tu centro de entrenamiento adaptativo.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "KOVA", statusBarStyle: "default" },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased">{children}</body>
    </html>
  );
}
