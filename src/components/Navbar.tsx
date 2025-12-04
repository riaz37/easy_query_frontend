"use client";
import React from "react";
import Image from "next/image";
import { Bell, LogIn } from "lucide-react";
import { useUIStore } from "@/store/uiStore";
import { useAuthContext } from "@/components/providers/AuthContextProvider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function Navbar() {
  const { showSidebar, setShowSidebar } = useUIStore();
  const { isAuthenticated, user, logout } = useAuthContext();

  const handleMenuClick = () => {
    setShowSidebar(!showSidebar);
  };

  return (
    <>
      <nav className="fixed left-4 right-4 top-6 z-50 backdrop-blur-xl rounded-full flex items-center justify-between shadow-2xl max-w-7xl mx-auto bg-white/5 border border-white/10 shadow-black/20 navbar-container
                      max-sm:left-2 max-sm:right-2 max-sm:top-4 max-sm:rounded-2xl
                      sm:left-4 sm:right-4 sm:top-6 sm:rounded-full
                      md:left-4 md:right-4 md:top-6 md:rounded-full
                      lg:left-4 lg:right-4 lg:top-6 lg:rounded-full
                      xl:left-4 xl:right-4 xl:top-6 xl:rounded-full">
      {/* Left side - Logo and Menu */}
      <div className="flex items-center gap-6 max-sm:gap-3 sm:gap-6">
        {/* EasyQuery Logo */}
        <div className="flex items-center gap-2 px-4 py-2 rounded-full max-sm:px-2 max-sm:py-1 sm:px-4 sm:py-2">
          <Image
            src="/logo/logo.svg"
            alt="EasyQuery"
            width={120}
            height={40}
            className="h-8 w-auto max-sm:h-6 max-sm:w-auto sm:h-8 sm:w-auto"
          />
        </div>

        {/* Menu Button */}
        <div
          onClick={handleMenuClick}
          className="flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 cursor-pointer group navbar-menu-button
                     max-sm:px-3 max-sm:py-2 max-sm:gap-1
                     sm:px-4 sm:py-2 sm:gap-2"
        >
          <div className="w-4 h-4 flex flex-col items-center justify-center gap-0.5">
            {/* Three horizontal bars */}
            <div
              className={cn(
                "w-4 h-0.5 rounded-full transition-all duration-300 bg-white",
                showSidebar ? "rotate-45 translate-y-1" : ""
              )}
            ></div>
            <div
              className={cn(
                "w-4 h-0.5 rounded-full transition-all duration-300 bg-white",
                showSidebar ? "opacity-0" : ""
              )}
            ></div>
            <div
              className={cn(
                "w-4 h-0.5 rounded-full transition-all duration-300 bg-white",
                showSidebar ? "-rotate-45 -translate-y-1" : ""
              )}
            ></div>
          </div>
          <span className="text-sm font-medium text-white transition-colors group-hover:text-white/90 max-sm:text-xs sm:text-sm">
            {showSidebar ? "Close" : "Menu"}
          </span>
        </div>
      </div>

      {/* Right side - Task Indicator, Notifications, Theme Toggle and User */}
      <div className="flex items-center gap-4 max-sm:gap-2 sm:gap-4">
      

        {/* Notification Bell */}
        <div className="relative">
          <div className="w-10 h-10 rounded-full flex items-center justify-center transition-colors cursor-pointer navbar-icon-button
                         max-sm:w-8 max-sm:h-8
                         sm:w-10 sm:h-10">
            <Bell className="w-5 h-5 text-white/90 max-sm:w-4 max-sm:h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center border-2 border-black/50
                         max-sm:w-4 max-sm:h-4 max-sm:-top-0.5 max-sm:-right-0.5
                         sm:w-5 sm:h-5 sm:-top-1 sm:-right-1">
            <span className="text-white text-xs font-bold max-sm:text-[10px] sm:text-xs">1</span>
          </div>
        </div>

        {/* Logout Button */}
        {isAuthenticated && user ? (
          <Button
            onClick={logout}
            className="navbar-signin-button transition-colors cursor-pointer text-white/90 hover:text-white hover:bg-gray-600/50
                       max-sm:px-3 max-sm:py-2 max-sm:text-sm
                       sm:px-4 sm:py-2 sm:text-sm"
          >
            <Image
              src="/dashboard/logout.svg"
              alt="Log Out"
              width={16}
              height={16}
              className="w-4 h-4 mr-2 max-sm:w-3 max-sm:h-3 max-sm:mr-1 sm:w-4 sm:h-4 sm:mr-2"
            />
            <span className="max-sm:text-xs sm:text-sm">Log Out</span>
          </Button>
        ) : (
          <Button
            onClick={() => (window.location.href = "/auth")}
            className="navbar-signin-button transition-colors cursor-pointer text-white/90 hover:text-white hover:bg-gray-600/50
                       max-sm:px-3 max-sm:py-2 max-sm:text-sm
                       sm:px-4 sm:py-2 sm:text-sm"
          >
            <LogIn className="w-4 h-4 mr-2 max-sm:w-3 max-sm:h-3 max-sm:mr-1 sm:w-4 sm:h-4 sm:mr-2" />
            <span className="max-sm:text-xs sm:text-sm">Sign In</span>
          </Button>
        )}
      </div>
      </nav>
    </>
  );
}