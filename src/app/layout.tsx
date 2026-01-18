import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ModelOptix - AI Model Cost Optimization",
  description:
    "Compare and optimize AI model spending across providers. Get real-time usage analytics and cost reduction recommendations.",
  keywords: ["AI", "model optimization", "cost analysis", "OpenAI", "Anthropic", "Claude"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background font-sans antialiased">{children}</body>
    </html>
  );
}
