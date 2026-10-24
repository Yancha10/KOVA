import type { Metadata } from "next";
import "./globals.css";
import "./touch.css";
import "./retro.css";

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
    <html lang="es" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{__html: "try{var t=localStorage.getItem('kova-theme')||'system';var d=t==='dark'||(t==='system'&&matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.dataset.theme=d?'dark':'light';document.documentElement.style.colorScheme=d?'dark':'light'}catch(e){}"}}/></head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
