'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  Database, 
  FileText, 
  History, 
  ArrowRight, 
  Activity,
  Zap,
  TrendingUp
} from 'lucide-react';
import { ServiceRegistry } from '@/lib/api';
import { useAuthContext } from '@/components/providers/AuthContextProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Database as DatabaseIcon } from 'lucide-react';

interface DashboardStats {
  totalDatabases: number;
  recentQueries: number;
  totalQueries: number;
  accessibleDatabases: Array<{
    id: number;
    name: string;
    description: string;
  }>;
}

export default function Dashboard() {
  const { user } = useAuthContext();
  const [stats, setStats] = useState<DashboardStats>({
    totalDatabases: 0,
    recentQueries: 0,
    totalQueries: 0,
    accessibleDatabases: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!user?.user_id) return;

      try {
        setLoading(true);
        
        // Load accessible databases
        const dbResponse = await ServiceRegistry.dashboard.getAccessibleDatabases(user.user_id);
        const databases = dbResponse.data?.databases || [];

        // Load recent queries
        const queriesResponse = await ServiceRegistry.dashboard.getRecentQueries(user.user_id, 5);
        const recentQueries = queriesResponse.data || [];

        setStats({
          totalDatabases: databases.length,
          recentQueries: recentQueries.length,
          totalQueries: 0, // Can be enhanced with total count
          accessibleDatabases: databases.slice(0, 6), // Show first 6
        });
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [user?.user_id]);

  const quickActions = [
    {
      title: 'Database Query',
      description: 'Execute SQL queries on your databases',
      icon: Database,
      href: '/database-query',
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'File Query',
      description: 'Query your uploaded files with AI',
      icon: FileText,
      href: '/file-query',
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      title: 'View History',
      description: 'Browse your query history and reports',
      icon: History,
      href: '/history',
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-1/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
      },
    },
  };

  return (
    <motion.div
      className="space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Welcome Section */}
      <motion.div variants={itemVariants}>
        <h2 className="text-2xl font-semibold mb-2">
          Welcome back, {user?.user_id || 'User'}
        </h2>
        <p className="text-muted-foreground">
          Here's an overview of your databases and recent activity
        </p>
      </motion.div>

      {/* Stats Cards */}
      <motion.div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4" variants={itemVariants}>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Accessible Databases</CardTitle>
            <DatabaseIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDatabases}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Databases you can query
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Queries</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.recentQueries}</div>
            <p className="text-xs text-muted-foreground mt-1">
              In the last 24 hours
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{quickActions.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Available features
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Activity</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Active</div>
            <p className="text-xs text-muted-foreground mt-1">
              System status
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={itemVariants}>
        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
        <div className="grid gap-4 md:grid-cols-3">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <motion.div
                key={action.href}
                variants={itemVariants}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Link href={action.href}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                  <CardHeader>
                    <div className={`w-12 h-12 rounded-lg ${action.bgColor} flex items-center justify-center mb-2`}>
                      <Icon className={`h-6 w-6 ${action.color}`} />
                    </div>
                    <CardTitle className="text-base">{action.title}</CardTitle>
                    <CardDescription>{action.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="ghost" size="sm" className="w-full justify-between">
                      Get started
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Accessible Databases */}
      <motion.div variants={itemVariants}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Your Databases</h3>
          {stats.accessibleDatabases.length > 0 && (
            <Link href="/tables">
              <Button variant="ghost" size="sm">
                View all
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          )}
        </div>

        {stats.accessibleDatabases.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <EmptyState
                icon={DatabaseIcon}
                title="No databases available"
                description="Contact your administrator to get access to databases"
              />
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {stats.accessibleDatabases.map((db) => (
              <motion.div
                key={db.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.2 }}
              >
                <Link href={`/database-query?db=${db.id}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <DatabaseIcon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base truncate">{db.name}</CardTitle>
                        <CardDescription className="truncate">
                          {db.description || `Database ${db.id}`}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Button variant="ghost" size="sm" className="w-full justify-between">
                      Query database
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
