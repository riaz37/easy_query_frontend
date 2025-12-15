"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUIStore } from "@/store/uiStore";
import { useAuthContext } from "@/components/providers/AuthContextProvider";
import { Shield, LayoutDashboard, Database, FileText, Table2, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Menu() {
  const pathname = usePathname();
  const { setShowSidebar } = useUIStore();
  const { tokens } = useAuthContext();

  const menuItems = [
    {
      name: "Dashboard",
      path: "/",
      iconComponent: LayoutDashboard,
    },
    ...(!tokens?.isAdmin
      ? [
          {
            name: "Database Query",
            path: "/database-query",
            iconComponent: Database,
          },
          {
            name: "File Query",
            path: "/file-query",
            iconComponent: FileText,
          },
          {
            name: "Table Management",
            path: "/table-management",
            iconComponent: Table2,
          },
          {
            name: "Report Generation",
            path: "/report-generation",
            iconComponent: BarChart3,
          },
        ]
      : []),
    ...(tokens?.isAdmin
      ? [
          {
            name: "Admin",
            path: "/admin",
            iconComponent: Shield,
          },
        ]
      : []),
  ];

  return (
    <div className="fixed top-[100px] left-1/2 -translate-x-[calc(50%+300px)] z-50 animate-in slide-in-from-top-4 duration-300
                    max-sm:left-4 max-sm:right-4 max-sm:translate-x-0 max-sm:top-20
                    sm:left-1/2 sm:-translate-x-[calc(50%+300px)]
                    md:left-1/2 md:-translate-x-[calc(50%+300px)]
                    lg:left-1/2 lg:-translate-x-[calc(50%+300px)]
                    xl:left-1/2 xl:-translate-x-[calc(50%+300px)]">
      <div
        className="w-80 max-h-[80vh] overflow-y-auto rounded-[32px] shadow-2xl border menu-dropdown-container
                   max-sm:w-full max-sm:max-h-[70vh] max-sm:rounded-2xl
                   sm:w-80 sm:max-h-[80vh]
                   md:w-80 md:max-h-[80vh]
                   lg:w-80 lg:max-h-[80vh]
                   xl:w-80 xl:max-h-[80vh]"
      >
        <div className="p-4 space-y-1 max-sm:p-3 max-sm:space-y-2">
          {menuItems.map((item) => {
            const isActive = pathname === item.path;
            const IconComponent = item.iconComponent;

            return (
              <Link
                key={item.name}
                href={item.path}
                onClick={() => setShowSidebar(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-[99px] text-sm font-medium transition-all duration-200 menu-item",
                  "max-sm:px-3 max-sm:py-4 max-sm:text-base max-sm:gap-4",
                  "sm:px-4 sm:py-3 sm:text-sm",
                  "md:px-4 md:py-3 md:text-sm",
                  "lg:px-4 lg:py-3 lg:text-sm",
                  "xl:px-4 xl:py-3 xl:text-sm",
                  isActive
                    ? "text-green-300 menu-item-active"
                    : "text-gray-300 hover:text-green-300 menu-item-hover"
                )}
              >
                <IconComponent className="h-7 w-7 max-sm:h-8 max-sm:w-8 sm:h-7 sm:w-7 text-current" />
                <span className="flex-1 max-sm:text-base sm:text-sm">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
