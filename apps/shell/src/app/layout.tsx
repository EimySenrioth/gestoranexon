import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import "@/design-tokens/global.css";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Estancia Perú",
    template: "%s · Estancia Perú",
  },
  description: "Shell de la aplicación Estancia Perú",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${geistMono.variable} h-full antialiased`}>
      <body suppressHydrationWarning className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
