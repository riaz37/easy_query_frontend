'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ServiceRegistry } from '@/lib/api';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Database, Shield, Activity } from 'lucide-react';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDatabases: 0,
    totalAccessEntries: 0,
    activeUsers: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const response = await ServiceRegistry.admin.getSystemStats();
        if (response.success) {
          setStats(response.data);
        }
      } catch (error) {
        console.error('Failed to load admin stats:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers,
      description: 'Registered users in the system',
      icon: Users,
      color: 'text-blue-600',
    },
    {
      title: 'Total Databases',
      value: stats.totalDatabases,
      description: 'Configured databases',
      icon: Database,
      color: 'text-green-600',
    },
    {
      title: 'Access Entries',
      value: stats.totalAccessEntries,
      description: 'User-database access assignments',
      icon: Shield,
      color: 'text-purple-600',
    },
    {
      title: 'Active Users',
      value: stats.activeUsers,
      description: 'Users with recent activity',
      icon: Activity,
      color: 'text-orange-600',
    },
  ];

  return (
    <AppLayout title="Admin Dashboard" description="Manage users, databases, and access permissions">
      <div className="space-y-6">

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <motion.div
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.1,
              },
            },
          }}
        >
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.title}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 },
                }}
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {stat.title}
                  </CardTitle>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stat.description}
                  </p>
                </CardContent>
              </Card>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      <motion.div
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.3 }}
      >
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Link href="/admin/users">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow h-full">
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>
                Create, edit, and manage user accounts
              </CardDescription>
            </CardHeader>
          </Card>
          </Link>
        </motion.div>

        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Link href="/admin/databases">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow h-full">
            <CardHeader>
              <CardTitle>Database Management</CardTitle>
              <CardDescription>
                Configure and manage database connections
              </CardDescription>
            </CardHeader>
          </Card>
          </Link>
        </motion.div>

        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Link href="/admin/access">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow h-full">
            <CardHeader>
              <CardTitle>Access Management</CardTitle>
              <CardDescription>
                Manage user-database access permissions
              </CardDescription>
            </CardHeader>
          </Card>
          </Link>
        </motion.div>

        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Link href="/admin/vector-db">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow h-full">
            <CardHeader>
              <CardTitle>Vector DB Management</CardTitle>
              <CardDescription>
                Configure and manage vector database connections
              </CardDescription>
            </CardHeader>
          </Card>
          </Link>
        </motion.div>
      </motion.div>
      </div>
    </AppLayout>
  );
}

