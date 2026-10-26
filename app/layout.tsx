import type { Metadata, Viewport } from "next";
import { Noto_Sans_Telugu } from "next/font/google";
import "./globals.css";

const notoTelugu = Noto_Sans_Telugu({
  variable: "--font-noto-telugu",
  subsets: ["telugu"],
  weight: ["400", "600", "700"],
});

export const metadata: Metadata = {
  title: "Mandu Chit",
  description: "Turn an English discharge summary into a large-print Telugu medicine plan.",
};

export const viewport: Viewport = {
  themeColor: "#FBF6EE",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${notoTelugu.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
