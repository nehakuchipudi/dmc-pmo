import type { Metadata } from "next";
import { Manrope, Poppins } from "next/font/google";
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
    "Watch short tours of the live DMC PMO workspace, then request a demo of portfolio, company, team, insights, and project plan.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${body.variable} ${display.variable} antialiased`}>
        <AuthProvider>
          {children}
          <ToastHost />
        </AuthProvider>
      </body>
    </html>
  );
}
