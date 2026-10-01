import type { Metadata } from "next";
import { Manrope, Poppins } from "next/font/google";
import { AzureRuntime } from "@/components/azure/AzureRuntime";
import { AuthProvider } from "@/lib/auth";
import { ToastHost } from "@/components/ui";
import "./globals.css";

const body = Manrope({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const display = Poppins({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "DMC PMO | Turn Projects Into Business Outcomes",
  description:
    "DMC PMO gives organizations one intelligent platform to plan, prioritize, govern, and deliver their entire project portfolio.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${body.variable} ${display.variable} antialiased`}>
        <AzureRuntime>
          <AuthProvider>
            {children}
            <ToastHost />
          </AuthProvider>
        </AzureRuntime>
      </body>
    </html>
  );
}
