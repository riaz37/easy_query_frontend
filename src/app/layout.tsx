"use client";
import { ThemeStoreProvider } from "@/components/ThemeStoreProvider";
import { ThemeTransitionProvider } from "@/components/ThemeTransitionProvider";
import { AuthContextProvider } from "@/components/providers/AuthContextProvider";
import { DatabaseContextProvider } from "@/components/providers/DatabaseContextProvider";
import { FileConfigContextProvider } from "@/components/providers/FileConfigContextProvider";
import { TaskManagerProvider } from "@/components/task-manager";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";
import { Barlow, Public_Sans } from "next/font/google";
import "./globals.css";
import { useTaskStore } from "@/store/task-store";

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
  const { isTaskListOpen, toggleTaskList } = useTaskStore();

  return (
    <>
      {/* Task Indicator Modal Overlay */}
      {isTaskListOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
            onClick={toggleTaskList}
          />
        </>
      )}

      {children}
    </>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          barlow.variable,
          publicSans.variable
        )}
      >
        <ThemeStoreProvider>
          <ThemeTransitionProvider>
            <AuthContextProvider>
              <DatabaseContextProvider>
                <FileConfigContextProvider>
                  <TaskManagerProvider>
                    <AppContent>{children}</AppContent>
                    <Toaster />
                  </TaskManagerProvider>
                </FileConfigContextProvider>
              </DatabaseContextProvider>
            </AuthContextProvider>
          </ThemeTransitionProvider>
        </ThemeStoreProvider>
      </body>
    </html>
  );
}
