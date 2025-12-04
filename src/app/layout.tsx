"use client";

import { Barlow, Public_Sans } from "next/font/google";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/store/uiStore";
import { AuthContextProvider } from "@/components/providers/AuthContextProvider";
import { DatabaseContextProvider } from "@/components/providers/DatabaseContextProvider";
import { Toaster } from "@/components/ui/sonner";
import Navbar from "@/components/Navbar";
import Menu from "@/components/Menu";

import "./globals.css";

// Configure Barlow for titles
const barlow = Barlow({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-barlow",
});

// Configure Public Sans for body text
const publicSans = Public_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-public-sans",
});

function AppContent({ children }: { children: React.ReactNode }) {
  const { showSidebar, setShowSidebar } = useUIStore();

  return (
    <>
      <Navbar />

      {/* Menu Overlay */}
      {showSidebar && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
            onClick={() => setShowSidebar(false)}
          />

          {/* Menu */}
          <Menu />
        </>
      )}

      <div className="min-h-screen w-full">
        <div className="flex-1 -mt-22 pt-22">{children}</div>
      </div>
    </>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          barlow.variable,
          publicSans.variable
        )}
      >
        <AuthContextProvider>
          <DatabaseContextProvider>
            <AppContent>{children}</AppContent>

            <Toaster />
          </DatabaseContextProvider>
        </AuthContextProvider>
      </body>
    </html>
  );
}
