import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Providers } from "@/components/providers";
import { ToastProvider } from "@/components/ui/toast";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { shouldEnablePreviewSpeedInsights } from "@/lib/preview-speed-insights";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "ASNOR Inventory",
  description: "Inventory Management System for Tech Resale",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="min-h-full flex flex-col antialiased">
        <Providers>
          <ToastProvider>{children}</ToastProvider>
        </Providers>
        {shouldEnablePreviewSpeedInsights(process.env.VERCEL_ENV) && <SpeedInsights />}
      </body>
    </html>
  );
}
