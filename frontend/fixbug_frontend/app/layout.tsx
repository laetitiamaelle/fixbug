import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/context/auth-context";
import { NotificationsProvider } from "@/context/notifications-context";
import "./globals.css";
import { Toaster } from "sonner";
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "FixBug — Corrigez vos bugs, gardez le contrôle",
  description: "FixBug relie testeurs, développeurs et chefs de projet à GitHub. Un agent IA supervisé propose des corrections validées par un humain avant toute Pull Request.",
  icons: {
    icon: '/logoFixbug.png',
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased overflow-x-hidden`}
      suppressHydrationWarning
    >
      <AuthProvider><body className="flex flex-col bg-white text-slate-900 antialiased overflow-x-hidden" style={{height:"100vh"}}>  <NotificationsProvider>{children}  <Toaster richColors position="top-right" closeButton /> </NotificationsProvider></body></AuthProvider>
    </html>
  );
}
