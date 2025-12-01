'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Database,
  FileText,
  History,
  Table,
  Settings,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  LogOut,
} from 'lucide-react';
import { useNavigationStore } from '@/store/navigation-store';
import { useAuthContext } from '@/components/providers/AuthContextProvider';
import { SidebarNavItem } from './SidebarNav';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

const navigationItems = [
  { href: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/database-query', icon: Database, label: 'Database Query' },
  { href: '/file-query', icon: FileText, label: 'File Query' },
  { href: '/history', icon: History, label: 'History' },
  { href: '/tables', icon: Table, label: 'Tables' },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { sidebarOpen, sidebarCollapsed, setSidebarOpen, toggleSidebarCollapsed } = useNavigationStore();
  const { user, logout, isAuthenticated } = useAuthContext();

  const handleLogout = async () => {
    await logout();
    router.push('/auth');
  };

  // Close sidebar on mobile when route changes
  useEffect(() => {
    const handleResize = () => {
      if (typeof window !== 'undefined' && window.innerWidth < 1024) {
        setSidebarOpen(false);
      }
    };
    
    if (typeof window !== 'undefined') {
      handleResize();
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, [pathname, setSidebarOpen]);

  // Don't show sidebar on auth pages
  if (!isAuthenticated || pathname.startsWith('/auth')) {
    return null;
  }

  const isAdmin = user?.isAdmin || user?.role === 'admin';

  return (
    <>
      {/* Mobile backdrop */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        className={cn(
          'fixed left-0 top-0 z-50 h-screen bg-sidebar border-r border-sidebar-border',
          'flex flex-col',
          sidebarCollapsed ? 'w-16' : 'w-64',
          'lg:translate-x-0'
        )}
        initial={false}
        animate={{
          x: sidebarOpen ? 0 : '-100%',
          width: sidebarCollapsed ? 64 : 256,
        }}
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 30,
        }}
      >
        <div className="flex h-full flex-col min-h-0">
          {/* Header */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-sidebar-border">
            {!sidebarCollapsed && (
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-sidebar-primary flex items-center justify-center">
                  <span className="text-sidebar-primary-foreground font-bold text-sm">EQ</span>
                </div>
                <span className="font-barlow font-semibold text-sidebar-foreground">Easy Query</span>
              </div>
            )}
            {sidebarCollapsed && (
              <div className="h-8 w-8 rounded-lg bg-sidebar-primary flex items-center justify-center mx-auto">
                <span className="text-sidebar-primary-foreground font-bold text-sm">EQ</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 lg:hidden"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
              {!sidebarCollapsed && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hidden lg:flex"
                  onClick={toggleSidebarCollapsed}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              )}
              {sidebarCollapsed && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hidden lg:flex"
                  onClick={toggleSidebarCollapsed}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex-1 min-h-0">
            <nav className="h-full overflow-y-auto px-3 pt-5 pb-6 space-y-6">
              <div className="space-y-1">
                {navigationItems.map((item) => (
                  <SidebarNavItem key={item.href} {...item} />
                ))}
              </div>

              {isAdmin && !sidebarCollapsed && (
                <div className="space-y-1">
                  <p className="px-3 text-xs font-semibold uppercase tracking-wide text-sidebar-foreground/40">
                    Administration
                  </p>
                  <SidebarNavItem
                    href="/admin"
                    icon={Settings}
                    label="Admin"
                  />
                </div>
              )}

              {isAdmin && sidebarCollapsed && (
                <SidebarNavItem
                  href="/admin"
                  icon={Settings}
                  label="Admin"
                />
              )}
            </nav>
          </div>

          {/* User Profile */}
          <div className="border-t border-sidebar-border p-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium',
                    'hover:bg-sidebar-accent transition-colors',
                    'text-sidebar-foreground',
                    sidebarCollapsed && 'justify-center'
                  )}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground">
                      {user?.user_id?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  {!sidebarCollapsed && (
                    <>
                      <div className="flex-1 text-left">
                        <div className="font-medium">{user?.user_id || 'User'}</div>
                        <div className="text-xs text-sidebar-foreground/60">
                          {isAdmin ? 'Admin' : 'User'}
                        </div>
                      </div>
                    </>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{user?.user_id || 'User'}</p>
                    <p className="text-xs text-muted-foreground">{user?.user_id || 'user@example.com'}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 mt-2',
                'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                'text-sidebar-foreground/70',
                sidebarCollapsed && 'justify-center'
              )}
            >
              <LogOut className="h-5 w-5 flex-shrink-0" />
              {!sidebarCollapsed && (
                <span className="flex-1 text-left">Logout</span>
              )}
            </button>
          </div>
        </div>
      </motion.aside>

      {/* Mobile menu button */}
      {!sidebarOpen && (
        <Button
          variant="ghost"
          size="icon"
          className="fixed top-4 left-4 z-50 lg:hidden h-10 w-10"
          onClick={() => setSidebarOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </Button>
      )}
    </>
  );
}

