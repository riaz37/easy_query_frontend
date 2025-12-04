"use client";

import React, { useEffect, useState } from "react";
import { PageLayout, PageHeader } from "@/components/layout/PageLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  Database, 
  Cpu, 
  Shield, 
  Activity, 
  ArrowRight,
  Server,
  Lock
} from "lucide-react";
import { adminService } from "@/lib/api/services/admin-service";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/components/providers/AuthContextProvider";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminDashboard() {
  const router = useRouter();
  const { tokens, isInitialized } = useAuthContext();
  const [stats, setStats] = useState<{
    totalUsers: number;
    totalDatabases: number;
    totalAccessEntries: number;
    activeUsers: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isInitialized && !tokens?.isAdmin) {
      toast.error("Access denied. Admin privileges required.");
      router.push("/");
      return;
    }

    if (isInitialized && tokens?.isAdmin) {
      fetchStats();
    }
  }, [isInitialized, tokens, router]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await adminService.getSystemStats();
      if (response.success && response.data) {
        setStats(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch system stats:", error);
      toast.error("Failed to load system statistics");
    } finally {
      setLoading(false);
    }
  };

  const adminModules = [
    {
      title: "User Management",
      description: "Manage users, roles, and account status",
      icon: <Users className="w-6 h-6 text-blue-400" />,
      path: "/admin/users",
      color: "bg-blue-500/10 border-blue-500/20",
      stats: stats ? `${stats.totalUsers} Users` : "Loading...",
    },
    {
      title: "Database Management",
      description: "Configure and manage MSSQL databases",
      icon: <Database className="w-6 h-6 text-emerald-400" />,
      path: "/admin/databases",
      color: "bg-emerald-500/10 border-emerald-500/20",
      stats: stats ? `${stats.totalDatabases} Databases` : "Loading...",
    },
    {
      title: "Vector DB Management",
      description: "Manage vector database configurations",
      icon: <Cpu className="w-6 h-6 text-purple-400" />,
      path: "/admin/vector-db",
      color: "bg-purple-500/10 border-purple-500/20",
      stats: "Vector Configs",
    },
    {
      title: "Access Control",
      description: "Manage user access to databases",
      icon: <Lock className="w-6 h-6 text-amber-400" />,
      path: "/admin/access",
      color: "bg-amber-500/10 border-amber-500/20",
      stats: stats ? `${stats.totalAccessEntries} Entries` : "Loading...",
    },
  ];

  if (!isInitialized || loading) {
    return (
      <PageLayout background={["frame", "gridframe"]} maxWidth="7xl" className="min-h-screen py-6">
        <PageHeader 
          title="Admin Dashboard" 
          description="System overview and management"
          icon={<Shield className="w-6 h-6 text-emerald-400" />}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl bg-white/5" />
          ))}
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout background={["frame", "gridframe"]} maxWidth="7xl" className="min-h-screen py-6">
      <PageHeader 
        title="Admin Dashboard" 
        description="System overview and management tools"
        icon={<Shield className="w-6 h-6 text-emerald-400" />}
        enhancedTitle
      />

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {adminModules.map((module, index) => (
          <Card 
            key={index}
            className={`p-6 border backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] cursor-pointer group ${module.color}`}
            onClick={() => router.push(module.path)}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 rounded-lg bg-white/5 group-hover:bg-white/10 transition-colors">
                {module.icon}
              </div>
              <Button variant="ghost" size="icon" className="text-gray-400 group-hover:text-white">
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
            <h3 className="text-lg font-semibold text-white mb-1 font-barlow">{module.title}</h3>
            <p className="text-sm text-gray-400 mb-3 font-public-sans line-clamp-2">{module.description}</p>
            <div className="flex items-center gap-2 text-xs font-medium text-gray-300 bg-black/20 px-2 py-1 rounded w-fit">
              <Activity className="w-3 h-3" />
              {module.stats}
            </div>
          </Card>
        ))}
      </div>

      {/* Quick Actions or Recent Activity could go here */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="p-6 border border-white/10 bg-white/5 backdrop-blur-sm">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2 font-barlow">
            <Activity className="w-5 h-5 text-blue-400" />
            System Status
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-sm text-gray-300">API Services</span>
              </div>
              <span className="text-xs text-green-400 font-medium">Operational</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-sm text-gray-300">Database Connection</span>
              </div>
              <span className="text-xs text-green-400 font-medium">Connected</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-sm text-gray-300">Vector Search</span>
              </div>
              <span className="text-xs text-green-400 font-medium">Operational</span>
            </div>
          </div>
        </Card>

        <Card className="p-6 border border-white/10 bg-white/5 backdrop-blur-sm">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2 font-barlow">
            <Server className="w-5 h-5 text-purple-400" />
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <Button 
              variant="outline" 
              className="h-auto py-4 flex flex-col gap-2 border-white/10 hover:bg-white/5 hover:text-white"
              onClick={() => router.push('/admin/users')}
            >
              <Users className="w-5 h-5" />
              <span className="text-xs">Add User</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto py-4 flex flex-col gap-2 border-white/10 hover:bg-white/5 hover:text-white"
              onClick={() => router.push('/admin/databases')}
            >
              <Database className="w-5 h-5" />
              <span className="text-xs">Add Database</span>
            </Button>
          </div>
        </Card>
      </div>
    </PageLayout>
  );
}
