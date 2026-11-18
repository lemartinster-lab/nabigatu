import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nabigatu · Calculadora de navegación",
  description:
    "Calculadora de navegación para el PER: corrección total, rumbos y demoras, declinación, viento, corriente y distancia-velocidad-tiempo, con el desarrollo paso a paso.",
};

export const viewport: Viewport = {
  themeColor: "#0c4a6e",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
