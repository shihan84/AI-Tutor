import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/contexts/AuthContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI Tutor - Personalized Learning Platform",
  description: "AI-powered tutoring platform for homeschooling with Indian open school syllabus support. Features real-time interaction, progress tracking, and personalized learning.",
  keywords: ["AI Tutor", "Homeschooling", "Indian Education", "Online Learning", "Personalized Education", "Progress Tracking"],
  authors: [{ name: "AI Tutor Team" }],
  openGraph: {
    title: "AI Tutor - Personalized Learning Platform",
    description: "AI-powered tutoring platform for homeschooling with Indian open school syllabus support",
    url: "https://ai-tutor.example.com",
    siteName: "AI Tutor",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Tutor - Personalized Learning Platform",
    description: "AI-powered tutoring platform for homeschooling",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
