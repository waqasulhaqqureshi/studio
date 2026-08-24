import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Video Tab Mockup Studio - 3:4 Dual Layer Studio",
  description: "Create professional 3:4 portrait videos with transparent mockup tab overlays on background videos.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-neutral-950 text-neutral-100 font-sans antialiased selection:bg-indigo-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
