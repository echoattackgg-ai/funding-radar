import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import BlockchainNetworkBackground from "@/components/BlockchainNetworkBackground";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Funding Radar",
  description: "Funding Radar",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <BlockchainNetworkBackground />
        {children}
      </body>
    </html>
  );
}
