"use client";

import React, { useEffect, useState } from "react";
import { PageLayout, PageHeader } from "@/components/layout/PageLayout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Lock, 
  Search, 
  Plus, 
  MoreVertical, 
  RefreshCw,
  Trash2,
  Database,
  Cpu,
  Check,
  X,
  User,
  XIcon
} from "lucide-react";
import { adminService } from "@/lib/api/services/admin-service";
import { vectorDBService, VectorDBConfig } from "@/lib/api/services/vector-db-service";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthContext } from "@/components/providers/AuthContextProvider";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { EmptyState } from "@/components/ui/empty-state";

interface UserAccess {
  user_id: string;
  config_ids: number[];
  db_ids: number[];
  access_details: any[];
  total_access_entries: number;
}

interface DatabaseConfig {
  db_id: number;
  db_name: string;
  db_url?: string;
  business_rule?: string;
  created_at?: string;
  updated_at?: string;
}

export default function AccessManagementPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialUserId = searchParams.get('userId') || "";
  
  const { tokens, isInitialized } = useAuthContext();
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>(initialUserId);
  const [userAccess, setUserAccess] = useState<UserAccess | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Resources
  const [databases, setDatabases] = useState<DatabaseConfig[]>([]);
  const [vectorConfigs, setVectorConfigs] = useState<VectorDBConfig[]>([]);

  // Grant Access State
  const [isGrantDialogOpen, setIsGrantDialogOpen] = useState(false);
  const [selectedDbs, setSelectedDbs] = useState<number[]>([]);
  const [selectedConfigs, setSelectedConfigs] = useState<number[]>([]);
  const [granting, setGranting] = useState(false);

  useEffect(() => {
    if (isInitialized && !tokens?.isAdmin) {
      toast.error("Access denied. Admin privileges required.");
      router.push("/");
      return;
    }

    if (isInitialized && tokens?.isAdmin) {
      fetchResources();
      fetchUsers();
    }
  }, [isInitialized, tokens, router]);

  useEffect(() => {
    if (selectedUser) {
      fetchUserAccess(selectedUser);
    } else {
      setUserAccess(null);
    }
  }, [selectedUser]);

  const fetchUsers = async () => {
    try {
      const response = await adminService.getAllUsers();
      if (response.success && Array.isArray(response.data)) {
        setUsers(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    }
  };

  const fetchResources = async () => {
    try {
      const [dbResponse, configResponse] = await Promise.all([
        adminService.getAllDatabases(),
        vectorDBService.getVectorDBConfigs()
      ]);

      // The API returns data in response.data.configs array for databases
      if (dbResponse.success && dbResponse.data?.configs && Array.isArray(dbResponse.data.configs)) {
        setDatabases(dbResponse.data.configs);
      } else if (dbResponse.success && Array.isArray(dbResponse.data)) {
        // Fallback: if configs doesn't exist, try direct array
        setDatabases(dbResponse.data);
      } else {
        setDatabases([]);
      }
      
      if (configResponse.success && Array.isArray(configResponse.data)) {
        setVectorConfigs(configResponse.data);
      } else {
        setVectorConfigs([]);
      }
    } catch (error) {
      console.error("Failed to fetch resources:", error);
      toast.error("Failed to load resources");
    }
  };

  const fetchUserAccess = async (userId: string) => {
    try {
      setLoading(true);
      const response = await adminService.getUserAccess(userId);
      if (response.success && response.data) {
        setUserAccess(response.data);
      } else {
        setUserAccess(null);
      }
    } catch (error) {
      console.error("Failed to fetch user access:", error);
      toast.error("Failed to load user access");
    } finally {
      setLoading(false);
    }
  };

  const handleGrantAccess = async () => {
    if (!selectedUser) return;
    if (selectedDbs.length === 0 && selectedConfigs.length === 0) {
      toast.error("Please select at least one resource");
      return;
    }

    try {
      setGranting(true);
      const response = await adminService.grantAccess(
        selectedUser,
        selectedDbs.length > 0 ? selectedDbs : undefined,
        selectedConfigs.length > 0 ? selectedConfigs : undefined
      );
      
      if (response.success) {
        toast.success("Access granted successfully");
        setIsGrantDialogOpen(false);
        setSelectedDbs([]);
        setSelectedConfigs([]);
        fetchUserAccess(selectedUser);
      } else {
        toast.error(response.error || "Failed to grant access");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to grant access");
    } finally {
      setGranting(false);
    }
  };

  const handleRevokeAccess = async (type: 'db' | 'config', id: number) => {
    if (!selectedUser) return;

    try {
      const response = await adminService.revokeAccess(
        selectedUser,
        type === 'db' ? [id] : undefined,
        type === 'config' ? [id] : undefined
      );
      
      if (response.success) {
        toast.success("Access revoked successfully");
        fetchUserAccess(selectedUser);
      } else {
        toast.error(response.error || "Failed to revoke access");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to revoke access");
    }
  };

  const toggleDbSelection = (id: number) => {
    setSelectedDbs(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleConfigSelection = (id: number) => {
    setSelectedConfigs(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  // Prepare data for tables
  const dbAccessData = userAccess?.db_ids?.map(id => {
    const db = databases.find(d => d.db_id === id);
    return { id, name: db?.db_name || `Database #${id}`, type: 'MSSQL' };
  }) || [];

  const configAccessData = userAccess?.config_ids?.map(id => {
    const config = vectorConfigs.find(c => c.db_id === id);
    return { id, name: config?.db_config?.DB_NAME || `Config #${id}`, type: 'Vector DB' };
  }) || [];

  const accessColumns: ColumnDef<any>[] = [
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => {
        const type = row.getValue("type") as string;
        return (
          <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            type === 'MSSQL' 
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
          }`}>
            {type === 'MSSQL' ? <Database className="w-3 h-3 mr-1" /> : <Cpu className="w-3 h-3 mr-1" />}
            {type}
          </div>
        );
      },
    },
    {
      accessorKey: "name",
      header: "Resource Name",
      cell: ({ row }) => <div className="font-medium text-white font-public-sans">{row.getValue("name")}</div>,
    },
    {
      accessorKey: "id",
      header: "ID",
      cell: ({ row }) => <div className="text-gray-400 font-public-sans">#{row.getValue("id")}</div>,
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const item = row.original;
        return (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => handleRevokeAccess(item.type === 'MSSQL' ? 'db' : 'config', item.id)}
            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
          >
            <Trash2 className="w-4 h-4 mr-2 text-red-400" />
            Revoke
          </Button>
        );
      },
    },
  ];

  return (
    <PageLayout background={["frame", "gridframe"]} maxWidth="7xl" className="min-h-screen py-6">
      <PageHeader 
        title="Access Management" 
        description="Manage user access to databases and vector configurations"
        icon={<Lock className="w-6 h-6 text-emerald-400" />}
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* User Selection Sidebar */}
        <Card className="p-4 border border-white/10 bg-white/5 backdrop-blur-sm lg:col-span-1 h-fit">
          <CardHeader className="p-0 pb-4">
            <CardTitle className="text-lg font-semibold text-white flex items-center gap-2 font-barlow">
              <User className="w-5 h-5 text-emerald-400" />
              Select User
            </CardTitle>
          </CardHeader>
          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
            {users.map((user) => (
              <div
                key={user.user_id}
                onClick={() => setSelectedUser(user.user_id)}
                className={`p-3 rounded-lg cursor-pointer transition-all ${
                  selectedUser === user.user_id
                    ? "bg-emerald-600/20 border border-emerald-500/50 text-white"
                    : "bg-white/5 border border-transparent text-gray-400 hover:bg-white/10 hover:text-white"
                }`}
              >
                <div className="font-medium font-public-sans">{user.user_id}</div>
                {user.role && (
                  <div className="text-xs opacity-70 mt-1 capitalize font-public-sans">{user.role}</div>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Access Details */}
        <Card className="p-6 border border-white/10 bg-white/5 backdrop-blur-sm lg:col-span-3 min-h-[500px]">
          {selectedUser ? (
            <>
              <CardHeader className="p-0 pb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl font-bold text-white mb-1 font-barlow">Access for {selectedUser}</CardTitle>
                    <CardDescription className="text-gray-400 text-sm font-public-sans">
                      {userAccess ? `${userAccess.total_access_entries} total resources accessible` : "Loading access details..."}
                    </CardDescription>
                  </div>
                  <Button onClick={() => setIsGrantDialogOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white font-barlow">
                    <Plus className="w-4 h-4 mr-2" />
                    Grant Access
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">

              <Tabs defaultValue="all" className="w-full">
                <TabsList className="bg-white/5 border border-white/10 mb-4">
                  <TabsTrigger value="all">All Resources</TabsTrigger>
                  <TabsTrigger value="mssql">MSSQL Databases</TabsTrigger>
                  <TabsTrigger value="vector">Vector Configs</TabsTrigger>
                </TabsList>
                
                <TabsContent value="all">
                  <DataTable 
                    columns={accessColumns} 
                    data={[...dbAccessData, ...configAccessData]} 
                    loading={loading}
                  />
                </TabsContent>
                
                <TabsContent value="mssql">
                  <DataTable 
                    columns={accessColumns} 
                    data={dbAccessData} 
                    loading={loading}
                  />
                </TabsContent>
                
                <TabsContent value="vector">
                  <DataTable 
                    columns={accessColumns} 
                    data={configAccessData} 
                    loading={loading}
                  />
                </TabsContent>
              </Tabs>
              </CardContent>
            </>
          ) : (
            <div className="flex items-center justify-center h-full min-h-[400px]">
              <p className="text-gray-400 text-center font-public-sans">
                Select a user from the sidebar to view and manage their access
              </p>
            </div>
          )}
        </Card>
      </div>

      {/* Grant Access Dialog */}
      <Dialog open={isGrantDialogOpen} onOpenChange={setIsGrantDialogOpen}>
        <DialogContent className="p-0 border-0 bg-transparent modal-lg" showCloseButton={false}>
          <div className="modal-enhanced">
            <div className="modal-content-enhanced">
              <DialogHeader className="modal-header-enhanced px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-2 sm:pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <DialogTitle className="modal-title-enhanced text-lg sm:text-xl flex items-center gap-3 font-barlow">
                      Grant Access
                    </DialogTitle>
                    <p className="modal-description-enhanced text-xs sm:text-sm font-public-sans">
                      Select resources to grant access to <strong>{selectedUser}</strong>.
                    </p>
                  </div>
                  <button onClick={() => setIsGrantDialogOpen(false)} className="modal-close-button cursor-pointer flex-shrink-0 ml-2">
                    <XIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                  </button>
                </div>
              </DialogHeader>
              <div className="flex-1 px-4 sm:px-6 lg:px-8 pb-4 sm:pb-6 overflow-y-auto">
                <div className="py-4">
            <Tabs defaultValue="mssql" className="w-full">
              <TabsList className="bg-white/5 border border-white/10 mb-4 w-full">
                <TabsTrigger value="mssql" className="flex-1">MSSQL Databases</TabsTrigger>
                <TabsTrigger value="vector" className="flex-1">Vector Configs</TabsTrigger>
              </TabsList>
              
              <TabsContent value="mssql" className="max-h-[300px] overflow-y-auto space-y-2">
                {databases.length === 0 ? (
                  <EmptyState
                    icon={Database}
                    title="No Databases Available"
                    description="No databases are configured in the system"
                    variant="minimal"
                    showAction={false}
                    size="sm"
                  />
                ) : (
                  databases.map(db => {
                    const hasAccess = userAccess?.db_ids?.includes(db.db_id);
                    const isSelected = selectedDbs.includes(db.db_id);
                    
                    return (
                      <div 
                        key={db.db_id}
                        className={`flex items-center justify-between p-3 rounded-lg border ${
                          hasAccess 
                            ? "bg-emerald-500/5 border-emerald-500/20 opacity-50 cursor-not-allowed" 
                            : isSelected
                              ? "bg-emerald-500/10 border-emerald-500/30 cursor-pointer"
                              : "bg-white/5 border-white/5 hover:bg-white/10 cursor-pointer"
                        }`}
                        onClick={() => !hasAccess && toggleDbSelection(db.db_id)}
                      >
                        <div className="flex items-center gap-3">
                          <Database className={`w-4 h-4 ${hasAccess ? "text-emerald-500" : "text-gray-400"}`} />
                          <span className={`${hasAccess ? "text-emerald-200" : "text-white"} font-public-sans`}>{db.db_name}</span>
                        </div>
                        {hasAccess ? (
                          <span className="text-xs text-emerald-500 flex items-center">
                            <Check className="w-3 h-3 mr-1" /> Granted
                          </span>
                        ) : (
                          <Checkbox 
                            checked={isSelected} 
                            onCheckedChange={() => toggleDbSelection(db.db_id)}
                            className="border-white/20 data-[state=checked]:bg-emerald-600"
                          />
                        )}
                      </div>
                    );
                  })
                )}
              </TabsContent>
              
              <TabsContent value="vector" className="max-h-[300px] overflow-y-auto space-y-2">
                {vectorConfigs.length === 0 ? (
                  <EmptyState
                    icon={Cpu}
                    title="No Vector Configs Available"
                    description="No vector database configurations are set up"
                    variant="minimal"
                    showAction={false}
                    size="sm"
                  />
                ) : (
                  vectorConfigs.map(config => {
                    const hasAccess = userAccess?.config_ids?.includes(config.db_id);
                    const isSelected = selectedConfigs.includes(config.db_id);
                    
                    return (
                      <div 
                        key={config.db_id}
                        className={`flex items-center justify-between p-3 rounded-lg border ${
                          hasAccess 
                            ? "bg-emerald-500/5 border-emerald-500/20 opacity-50 cursor-not-allowed" 
                            : isSelected
                              ? "bg-emerald-500/10 border-emerald-500/30 cursor-pointer"
                              : "bg-white/5 border-white/5 hover:bg-white/10 cursor-pointer"
                        }`}
                        onClick={() => !hasAccess && toggleConfigSelection(config.db_id)}
                      >
                        <div className="flex items-center gap-3">
                          <Cpu className={`w-4 h-4 ${hasAccess ? "text-emerald-500" : "text-gray-400"}`} />
                          <span className={`${hasAccess ? "text-emerald-200" : "text-white"} font-public-sans`}>
                            {config.db_config?.DB_NAME || `Config #${config.db_id}`}
                          </span>
                        </div>
                        {hasAccess ? (
                          <span className="text-xs text-emerald-500 flex items-center">
                            <Check className="w-3 h-3 mr-1" /> Granted
                          </span>
                        ) : (
                          <Checkbox 
                            checked={isSelected} 
                            onCheckedChange={() => toggleConfigSelection(config.db_id)}
                            className="border-white/20 data-[state=checked]:bg-emerald-600"
                          />
                        )}
                      </div>
                    );
                  })
                )}
              </TabsContent>
                </Tabs>
                </div>
                <DialogFooter className="px-0 pb-0 pt-4">
                  <Button variant="outline" onClick={() => setIsGrantDialogOpen(false)} className="border-white/10 text-white hover:bg-white/5 font-barlow">
                    Cancel
                  </Button>
                  <Button onClick={handleGrantAccess} disabled={granting} className="bg-emerald-600 hover:bg-emerald-700 text-white font-barlow">
                    {granting ? "Granting..." : `Grant Access (${selectedDbs.length + selectedConfigs.length})`}
                  </Button>
                </DialogFooter>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}
