import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sharvic Micro-Finance - Village Banking System",
  description: "Village Banking Management System for Sharvic Micro-Finance Group",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
