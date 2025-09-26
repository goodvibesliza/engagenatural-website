import { useState, useEffect, useMemo, useCallback } from 'react';
import { collection, query, getDocs, orderBy, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { useRoleAccess } from '../../../hooks/use-role-access';
import UserForm from './user-form';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/input';
import { Badge } from '../../ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../ui/alert-dialog';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../ui/dropdown-menu';
import { 
  Search, 
  Filter, 
  Plus, 
  MoreHorizontal, 
  Eye, 
  Edit, 
  Trash2, 
  UserCheck,
  UserX,
  Mail,
  Loader2,
  AlertCircle
} from 'lucide-react';

export default function UserManagementIntegrated() {
  const { canAccess } = useRoleAccess();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterRole, setFilterRole] = useState('all');

  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [confirmDialogConfig, setConfirmDialogConfig] = useState({ title: '', description: '', action: null });

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const usersCollection = collection(db, 'users');
      const q = query(usersCollection, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const usersList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        joinDate: doc.data().createdAt?.toDate(),
        lastLogin: doc.data().lastLogin?.toDate(),
      }));
      setUsers(usersList);
    } catch (err) {
      console.error("Error fetching users:", err);
      setError("Failed to load user data. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const name = `${user.firstName || ''} ${user.lastName || ''}`;
      const email = user.email || '';
      const role = user.role || '';
      const status = user.status || '';

      const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'all' || status === filterStatus;
      const matchesRole = filterRole === 'all' || role === filterRole;
      
      return matchesSearch && matchesStatus && matchesRole;
    });
  }, [users, searchTerm, filterStatus, filterRole]);

  const handleUpdateUserStatus = async (userId, newStatus) => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, { status: newStatus });
      setUsers(users.map(u => u.id === userId ? { ...u, status: newStatus } : u));
    } catch (err) {
      console.error(`Error updating user status to ${newStatus}:`, err);
      setError(`Failed to update user status. Please try again.`);
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      await deleteDoc(doc(db, 'users', userId));
      setUsers(users.filter(u => u.id !== userId));
    } catch (err) {
      console.error("Error deleting user:", err);
      setError("Failed to delete user. Please try again.");
    }
  };

  const openConfirmationDialog = (config) => {
    setConfirmDialogConfig(config);
    setIsConfirmDialogOpen(true);
  };

  const handleOpenForm = (user = null) => {
    setSelectedUser(user);
    setIsFormOpen(true);
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    fetchUsers(); // Refresh data from Firebase
  };

  const getRoleDisplayName = (role) => {
    const roles = {
      super_admin: 'Super Admin',
      brand_manager: 'Brand Manager',
      retail_user: 'Retail User',
      community_user: 'Community User',
    };
    return roles[role] || role;
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>;
      case 'inactive':
        return <Badge variant="secondary">Inactive</Badge>;
      case 'pending_verification':
        return <Badge variant="outline" className="border-yellow-500 text-yellow-700">Pending</Badge>;
      case 'suspended':
        return <Badge variant="destructive">Suspended</Badge>;
      default:
        return <Badge variant="secondary">{status || 'Unknown'}</Badge>;
    }
  };

  const getVerificationBadge = (status) => {
    switch (status) {
      case 'verified':
        return <Badge variant="default" className="bg-blue-100 text-blue-800">Verified</Badge>;
      case 'pending':
        return <Badge variant="outline" className="border-orange-500 text-orange-700">Pending</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status || 'N/A'}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">Manage user accounts, roles, and permissions</p>
        </div>
        {canAccess(['manage_users']) && (
          <Button onClick={() => handleOpenForm()}>
            <Plus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Directory</CardTitle>
          <CardDescription>Search and filter users by status, role, or other criteria</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline"><Filter className="mr-2 h-4 w-4" />Status: {filterStatus}</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setFilterStatus('all')}>All</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterStatus('active')}>Active</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterStatus('inactive')}>Inactive</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterStatus('pending_verification')}>Pending</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterStatus('suspended')}>Suspended</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline"><Filter className="mr-2 h-4 w-4" />Role: {filterRole}</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setFilterRole('all')}>All</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterRole('super_admin')}>Super Admin</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterRole('brand_manager')}>Brand Manager</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterRole('retail_user')}>Retail User</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterRole('community_user')}>Community User</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 text-red-700 border border-red-200 rounded-md flex items-center">
              <AlertCircle className="h-5 w-5 mr-3" />
              {error}
            </div>
          )}

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Verification</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="flex justify-center items-center">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        <span className="ml-4 text-muted-foreground">Loading users...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="font-medium">{`${user.firstName || ''} ${user.lastName || ''}`.trim() || 'N/A'}</div>
                        <div className="text-sm text-muted-foreground flex items-center">
                          <Mail className="mr-1 h-3 w-3" />
                          {user.email}
                        </div>
                      </TableCell>
                      <TableCell><Badge variant="outline">{getRoleDisplayName(user.role)}</Badge></TableCell>
                      <TableCell>{getStatusBadge(user.status)}</TableCell>
                      <TableCell>{getVerificationBadge(user.verificationStatus)}</TableCell>
                      <TableCell>{user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem><Eye className="mr-2 h-4 w-4" />View Details</DropdownMenuItem>
                            {canAccess(['manage_users']) && (
                              <>
                                <DropdownMenuItem onClick={() => handleOpenForm(user)}>
                                  <Edit className="mr-2 h-4 w-4" />Edit User
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {user.status !== 'suspended' ? (
                                  <DropdownMenuItem onClick={() => openConfirmationDialog({
                                    title: 'Suspend User?',
                                    description: `Are you sure you want to suspend ${user.firstName}? They will lose access to the platform.`,
                                    action: () => handleUpdateUserStatus(user.id, 'suspended')
                                  })}>
                                    <UserX className="mr-2 h-4 w-4" />Suspend
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem onClick={() => openConfirmationDialog({
                                    title: 'Activate User?',
                                    description: `Are you sure you want to reactivate ${user.firstName}? They will regain access.`,
                                    action: () => handleUpdateUserStatus(user.id, 'active')
                                  })}>
                                    <UserCheck className="mr-2 h-4 w-4" />Activate
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem 
                                  className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                  onClick={() => openConfirmationDialog({
                                    title: 'Delete User?',
                                    description: `This action is permanent. Are you sure you want to delete ${user.firstName}?`,
                                    action: () => handleDeleteUser(user.id)
                                  })}>
                                  <Trash2 className="mr-2 h-4 w-4" />Delete
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No users found matching your criteria.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{selectedUser ? 'Edit User' : 'Add New User'}</DialogTitle>
            <DialogDescription>
              {selectedUser ? 'Update the details for this user.' : 'Create a new user profile in the system.'}
            </DialogDescription>
          </DialogHeader>
          <UserForm currentUser={selectedUser} onSuccess={handleFormSuccess} />
        </DialogContent>
      </Dialog>

      <AlertDialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmDialogConfig.title}</AlertDialogTitle>
            <AlertDialogDescription>{confirmDialogConfig.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              confirmDialogConfig.action && confirmDialogConfig.action();
              setIsConfirmDialogOpen(false);
            }}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
