import type { Metadata } from "next";
import { Fraunces, Source_Sans_3 } from "next/font/google";
import { AuthProvider } from "@/lib/auth";
import { ToastHost } from "@/components/ui";
import "./globals.css";

const display = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const body = Source_Sans_3({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Dillon Morgan PMO",
  description:
    "Professional services automation for Dillon Morgan Consulting: projects, tickets, billing, and client portal.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${display.variable} ${body.variable} antialiased`}>
        <AuthProvider>
          {children}
          <ToastHost />
        </AuthProvider>
      </body>
    </html>
  );
}
