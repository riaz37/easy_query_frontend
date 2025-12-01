'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigationStore } from '@/store/navigation-store';

interface SidebarNavItemProps {
  href: string;
  icon: LucideIcon;
  label: string;
  badge?: number | string;
  onClick?: () => void;
}

export function SidebarNavItem({ href, icon: Icon, label, badge, onClick }: SidebarNavItemProps) {
  const pathname = usePathname();
  const { sidebarCollapsed, setActiveRoute } = useNavigationStore();
  const isActive = pathname === href || pathname.startsWith(href + '/');

  const handleClick = () => {
    setActiveRoute(href);
    onClick?.();
  };

  return (
    <Link
      href={href}
      onClick={handleClick}
      className={cn(
        'group flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
        'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
        isActive
          ? 'bg-sidebar-accent text-sidebar-accent-foreground'
          : 'text-sidebar-foreground/70',
        sidebarCollapsed && 'justify-center'
      )}
    >
      <Icon className={cn('h-5 w-5 flex-shrink-0', isActive && 'text-sidebar-primary')} />
      {!sidebarCollapsed && (
        <>
          <span className="flex-1">{label}</span>
          {badge !== undefined && (
            <span className="px-2 py-0.5 text-xs rounded-full bg-sidebar-primary/20 text-sidebar-primary">
              {badge}
            </span>
          )}
        </>
      )}
    </Link>
  );
}

