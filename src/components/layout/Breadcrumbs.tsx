'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';

export function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);
  const isRoot = segments.length === 0;
  
  const breadcrumbs = segments.map((segment, index) => {
    const href = '/' + segments.slice(0, index + 1).join('/');
    const label = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
    const isLast = index === segments.length - 1;

    return {
      href,
      label,
      isLast,
    };
  });

  return (
    <nav className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm text-muted-foreground">
      <Link
        href="/"
        className="hover:text-foreground transition-colors"
        aria-label="Home"
      >
        <Home className="h-3 w-3 sm:h-4 sm:w-4" />
      </Link>
      {isRoot ? (
        <div className="flex items-center space-x-1 sm:space-x-2 text-foreground">
          <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
          <span className="font-medium">Dashboard</span>
        </div>
      ) : (
        breadcrumbs.map((crumb) => (
          <div key={crumb.href} className="flex items-center space-x-1 sm:space-x-2">
            <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
            {crumb.isLast ? (
              <span className="text-foreground font-medium truncate max-w-[120px] sm:max-w-none">
                {crumb.label}
              </span>
            ) : (
              <Link
                href={crumb.href}
                className="hover:text-foreground transition-colors truncate max-w-[100px] sm:max-w-none"
              >
                {crumb.label}
              </Link>
            )}
          </div>
        ))
      )}
    </nav>
  );
}

