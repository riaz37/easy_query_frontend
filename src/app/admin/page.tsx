"use client";

import React, { useEffect, useState } from "react";
import { PageLayout, PageHeader } from "@/components/layout/PageLayout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  Database, 
  Cpu, 
  Shield, 
  Activity, 
  ArrowRight,
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
    totalVectorDBs: number;
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
      icon: <Users className="w-6 h-6 text-emerald-400" />,
      path: "/admin/users",
      color: "bg-emerald-500/10 border-emerald-500/20",
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
      icon: <Cpu className="w-6 h-6 text-emerald-400" />,
      path: "/admin/vector-db",
      color: "bg-emerald-500/10 border-emerald-500/20",
      stats: stats ? `${stats.totalVectorDBs} Configs` : "Loading...",
    },
    {
      title: "Access Control",
      description: "Manage user access to databases",
      icon: <Lock className="w-6 h-6 text-emerald-400" />,
      path: "/admin/access",
      color: "bg-emerald-500/10 border-emerald-500/20",
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
            className={`border backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] cursor-pointer group ${module.color}`}
            onClick={() => router.push(module.path)}
          >
            <CardHeader className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 rounded-lg bg-white/5 group-hover:bg-white/10 transition-colors">
                  {module.icon}
                </div>
                <Button variant="ghost" size="icon" className="text-gray-400 group-hover:text-white">
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
              <CardTitle className="text-lg font-semibold text-white mb-1 font-barlow">{module.title}</CardTitle>
              <CardDescription className="text-sm text-gray-400 mb-3 font-public-sans line-clamp-2">{module.description}</CardDescription>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <div className="flex items-center gap-2 text-xs font-medium text-gray-300 bg-black/20 px-2 py-1 rounded w-fit font-public-sans">
                <Activity className="w-3 h-3" />
                {module.stats}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

    </PageLayout>
  );
}
