'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Sidebar } from './Sidebar';
import { Breadcrumbs } from './Breadcrumbs';
import { useNavigationStore } from '@/store/navigation-store';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  children: ReactNode;
  showBreadcrumbs?: boolean;
}

export function AppLayout({
  children,
  showBreadcrumbs = true,
}: AppLayoutProps) {
  const { sidebarCollapsed } = useNavigationStore();

  const desktopContentOffset = sidebarCollapsed ? 'lg:ml-[64px]' : 'lg:ml-[256px]';

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      
      <div className={cn('flex flex-1 flex-col overflow-hidden transition-all duration-300', desktopContentOffset)}>
        <main className="flex-1 overflow-y-auto bg-background">
          <motion.div
            className="container mx-auto px-4 py-6 lg:px-6 lg:py-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {showBreadcrumbs && (
              <div className="mb-10">
                <Breadcrumbs />
              </div>
            )}
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}

