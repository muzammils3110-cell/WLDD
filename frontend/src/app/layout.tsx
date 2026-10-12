import type { Metadata } from "next";
import { ReactNode } from "react";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

export const metadata: Metadata = {
  title: "Meme'd Campaign Payout Tracker",
  description: "Milestone-based creator payouts for brand campaigns",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}