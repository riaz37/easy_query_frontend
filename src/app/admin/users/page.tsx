"use client";

import React, { useEffect, useState } from "react";
import { PageLayout, PageHeader } from "@/components/layout/PageLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Users, 
  Search, 
  Plus, 
  MoreVertical, 
  Shield, 
  User as UserIcon,
  Key,
  Database,
  RefreshCw,
  XIcon
} from "lucide-react";
import { adminService } from "@/lib/api/services/admin-service";
import { useRouter } from "next/navigation";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { EmptyState } from "@/components/ui/empty-state";
import { CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

// Define User type based on API response
interface User {
  user_id: string;
  username?: string;
  email?: string;
  role?: string;
  is_active?: boolean;
  created_at?: string;
  // Add other fields as needed
}

export default function UserManagementPage() {
  const router = useRouter();
  const { tokens, isInitialized } = useAuthContext();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Create User State
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newUser, setNewUser] = useState({ userId: "", password: "", role: "user" as "admin" | "user" });
  const [creatingUser, setCreatingUser] = useState(false);

  // Change Password State
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    if (isInitialized && !tokens?.isAdmin) {
      toast.error("Access denied. Admin privileges required.");
      router.push("/");
      return;
    }

    if (isInitialized && tokens?.isAdmin) {
      fetchUsers();
    }
  }, [isInitialized, tokens, router]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await adminService.getAllUsers();
      if (response.success && Array.isArray(response.data)) {
        setUsers(response.data);
      } else {
        setUsers([]);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    if (!newUser.userId || !newUser.password) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      setCreatingUser(true);
      const response = await adminService.createUser(newUser.userId, newUser.password, newUser.role);
      
      if (response.success) {
        toast.success("User created successfully");
        setIsCreateDialogOpen(false);
        setNewUser({ userId: "", password: "", role: "user" });
        fetchUsers();
      } else {
        toast.error(response.error || "Failed to create user");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to create user");
    } finally {
      setCreatingUser(false);
    }
  };

  const handleChangePassword = async () => {
    if (!selectedUser || !newPassword) return;

    try {
      setChangingPassword(true);
      const response = await adminService.adminChangePassword(selectedUser.user_id, newPassword);
      
      if (response.success) {
        toast.success("Password changed successfully");
        setIsPasswordDialogOpen(false);
        setNewPassword("");
        setSelectedUser(null);
      } else {
        toast.error(response.error || "Failed to change password");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to change password");
    } finally {
      setChangingPassword(false);
    }
  };

  const handleToggleRole = async (user: User) => {
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    try {
      const response = await adminService.setUserRole(user.user_id, newRole);
      if (response.success) {
        toast.success(`User role updated to ${newRole}`);
        fetchUsers();
      } else {
        toast.error(response.error || "Failed to update role");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to update role");
    }
  };

  const filteredUsers = users.filter(user => 
    user.user_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (user.username && user.username.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const columns: ColumnDef<User>[] = [
    {
      accessorKey: "user_id",
      header: "User ID",
      cell: ({ row }) => <div className="font-medium text-white font-barlow">{row.getValue("user_id")}</div>,
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => {
        const role = row.getValue("role") as string;
        return (
          <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            role === 'admin' 
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
          }`}>
            {role === 'admin' ? <Shield className="w-3 h-3 mr-1" /> : <UserIcon className="w-3 h-3 mr-1" />}
            <span className="font-public-sans">{role || 'user'}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "created_at",
      header: "Created At",
      cell: ({ row }) => {
        const date = row.getValue("created_at") as string;
        return <div className="text-gray-400 font-public-sans">{date ? new Date(date).toLocaleDateString() : '-'}</div>;
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const user = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-white/5">
                <span className="sr-only">Open menu</span>
                <MoreVertical className="h-4 w-4 text-gray-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-[#1a1f2e] border-white/10 text-white">
              <DropdownMenuLabel className="text-white font-barlow">Actions</DropdownMenuLabel>
              <DropdownMenuItem 
                onClick={() => {
                  setSelectedUser(user);
                  setIsPasswordDialogOpen(true);
                }}
                className="cursor-pointer hover:bg-white/5 focus:bg-white/5 text-white"
              >
                <Key className="mr-2 h-4 w-4" />
                Change Password
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handleToggleRole(user)}
                className="cursor-pointer hover:bg-white/5 focus:bg-white/5 text-white"
              >
                <Shield className="mr-2 h-4 w-4" />
                {user.role === 'admin' ? 'Demote to User' : 'Promote to Admin'}
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem 
                onClick={() => router.push(`/admin/access?userId=${user.user_id}`)}
                className="cursor-pointer hover:bg-white/5 focus:bg-white/5 text-white"
              >
                <Database className="mr-2 h-4 w-4" />
                Manage Access
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <PageLayout background={["frame", "gridframe"]} maxWidth="7xl" className="min-h-screen py-6">
      <PageHeader 
        title="User Management" 
        description="Create users, manage roles and passwords"
        icon={<Users className="w-6 h-6 text-emerald-400" />}
        actions={
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-barlow">
                <Plus className="w-4 h-4 mr-2" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent className="p-0 border-0 bg-transparent modal-lg" showCloseButton={false}>
              <div className="modal-enhanced">
                <div className="modal-content-enhanced">
                  <DialogHeader className="modal-header-enhanced px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-2 sm:pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <DialogTitle className="modal-title-enhanced text-lg sm:text-xl flex items-center gap-3 font-barlow">
                          Create New User
                        </DialogTitle>
                        <p className="modal-description-enhanced text-xs sm:text-sm font-public-sans">
                          Add a new user to the system. They will be able to log in immediately.
                        </p>
                      </div>
                      <button onClick={() => setIsCreateDialogOpen(false)} className="modal-close-button cursor-pointer flex-shrink-0 ml-2">
                        <XIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                      </button>
                    </div>
                  </DialogHeader>
                  <div className="flex-1 px-4 sm:px-6 lg:px-8 pb-4 sm:pb-6 overflow-y-auto">
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="userId" className="text-white font-public-sans">User ID</Label>
                        <Input
                          id="userId"
                          value={newUser.userId}
                          onChange={(e) => setNewUser({ ...newUser, userId: e.target.value })}
                          className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 font-public-sans"
                          placeholder="jdoe"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="password" className="text-white font-public-sans">Password</Label>
                        <Input
                          id="password"
                          type="password"
                          value={newUser.password}
                          onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                          className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 font-public-sans"
                          placeholder="********"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="role" className="text-white font-public-sans">Role</Label>
                        <Select 
                          value={newUser.role} 
                          onValueChange={(value: "admin" | "user") => setNewUser({ ...newUser, role: value })}
                        >
                          <SelectTrigger className="bg-white/5 border-white/10 text-white font-public-sans">
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent className="bg-[#1a1f2e] border-white/10 text-white">
                            <SelectItem value="user" className="font-public-sans">User</SelectItem>
                            <SelectItem value="admin" className="font-public-sans">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter className="px-0 pb-0 pt-4">
                      <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} className="border-white/10 text-white hover:bg-white/5 font-barlow">
                        Cancel
                      </Button>
                      <Button onClick={handleCreateUser} disabled={creatingUser} className="bg-emerald-600 hover:bg-emerald-700 text-white font-barlow">
                        {creatingUser ? "Creating..." : "Create User"}
                      </Button>
                    </DialogFooter>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      <Card className="p-6 border border-white/10 bg-white/5 backdrop-blur-sm">
        <div className="flex items-center mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input 
              placeholder="Search users..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-gray-500 font-public-sans"
            />
          </div>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={fetchUsers} 
            className="ml-2 border-white/10 text-gray-400 hover:text-white hover:bg-white/5"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>

        <DataTable 
          columns={columns} 
          data={filteredUsers} 
          loading={loading}
        />
      </Card>

      {/* Change Password Dialog */}
      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent className="p-0 border-0 bg-transparent modal-lg" showCloseButton={false}>
          <div className="modal-enhanced">
            <div className="modal-content-enhanced">
              <DialogHeader className="modal-header-enhanced px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-2 sm:pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <DialogTitle className="modal-title-enhanced text-lg sm:text-xl flex items-center gap-3 font-barlow">
                      Change Password
                    </DialogTitle>
                    <p className="modal-description-enhanced text-xs sm:text-sm font-public-sans">
                      Set a new password for user <strong className="text-white">{selectedUser?.user_id}</strong>.
                    </p>
                  </div>
                  <button onClick={() => setIsPasswordDialogOpen(false)} className="modal-close-button cursor-pointer flex-shrink-0 ml-2">
                    <XIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                  </button>
                </div>
              </DialogHeader>
              <div className="flex-1 px-4 sm:px-6 lg:px-8 pb-4 sm:pb-6 overflow-y-auto">
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="newPassword" className="text-white font-public-sans">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 font-public-sans"
                      placeholder="At least 8 characters"
                    />
                  </div>
                </div>
                <DialogFooter className="px-0 pb-0 pt-4">
                  <Button variant="outline" onClick={() => setIsPasswordDialogOpen(false)} className="border-white/10 text-white hover:bg-white/5 font-barlow">
                    Cancel
                  </Button>
                  <Button onClick={handleChangePassword} disabled={changingPassword} className="bg-emerald-600 hover:bg-emerald-700 text-white font-barlow">
                    {changingPassword ? "Updating..." : "Update Password"}
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
