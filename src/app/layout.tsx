// src/app/layout.tsx
import "./globals.css";
import React, { ReactNode } from "react";

export const metadata = {
  title: "Flowgrid v1.5",
  description: "Lightweight task/project manager (demo build)",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-neutral-50 text-neutral-900">{children}</body>
    </html>
  );
}
