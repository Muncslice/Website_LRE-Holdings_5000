import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import StatusBadge from '@/components/StatusBadge';
import { Plus, Edit, Search, UserCheck, UserX } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    phone: '',
    role: 'affiliate',
    status: 'active',
  });

  console.log('👥 USERS: Component mounted');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      console.log('👥 USERS: Loading users data...');
      setLoading(true);
      const { data, error } = await supabase
        .from('users_extended')
        .select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ USERS: Error loading users:', error);
        throw error;
      }

      console.log('✅ USERS: Loaded', data?.length, 'users');
      setUsers(data || []);
    } catch (error: any) {
      console.error('❌ USERS: Load failed:', error);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('👥 USERS: Submitting form...', editingUser ? 'UPDATE' : 'INSERT');

    try {
      if (editingUser) {
        // Update existing user
        const { error } = await supabase
          .from('users_extended')
          .update({
            full_name: formData.full_name,
            phone: formData.phone,
            role: formData.role,
            status: formData.status,
          })
          .eq('id', editingUser.id);

        if (error) throw error;
        console.log('✅ USERS: User updated successfully');
        toast({ title: 'Success', description: 'User updated successfully' });
      } else {
        // Create new user
        console.log('👥 USERS: Creating new auth user...');
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
        });

        if (authError) throw authError;
        if (!authData.user) throw new Error('Failed to create user');

        console.log('👥 USERS: Auth user created:', authData.user.id);

        // Create extended user profile
        const { error: profileError } = await supabase
          .from('users_extended')
          .insert([{
            id: authData.user.id,
            full_name: formData.full_name,
            phone: formData.phone,
            role: formData.role,
            status: formData.status,
          }]);

        if (profileError) throw profileError;
        console.log('✅ USERS: User created successfully');
        toast({ title: 'Success', description: 'User created successfully' });
      }

      setIsAddDialogOpen(false);
      setEditingUser(null);
      resetForm();
      loadUsers();
    } catch (error: any) {
      console.error('❌ USERS: Submit failed:', error);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (user: any) => {
    console.log('👥 USERS: Editing user:', user.id);
    setEditingUser(user);
    setFormData({
      email: user.email || '',
      password: '',
      full_name: user.full_name,
      phone: user.phone || '',
      role: user.role,
      status: user.status,
    });
    setIsAddDialogOpen(true);
  };

  const handleApprove = async (userId: string) => {
    console.log('👥 USERS: Approving user:', userId);
    try {
      const { error } = await supabase
        .from('users_extended')
        .update({ status: 'active' })
        .eq('id', userId);

      if (error) throw error;
      console.log('✅ USERS: User approved successfully');
      toast({ title: 'Success', description: 'User approved successfully' });
      loadUsers();
    } catch (error: any) {
      console.error('❌ USERS: Approve failed:', error);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleSuspend = async (userId: string) => {
    console.log('👥 USERS: Suspending user:', userId);
    try {
      const { error } = await supabase
        .from('users_extended')
        .update({ status: 'suspended' })
        .eq('id', userId);

      if (error) throw error;
      console.log('✅ USERS: User suspended successfully');
      toast({ title: 'Success', description: 'User suspended successfully' });
      loadUsers();
    } catch (error: any) {
      console.error('❌ USERS: Suspend failed:', error);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    console.log('👥 USERS: Resetting form');
    setFormData({
      email: '',
      password: '',
      full_name: '',
      phone: '',
      role: 'affiliate',
      status: 'active',
    });
  };

  const filteredUsers = users.filter(
    (user) =>
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  console.log('👥 USERS: Filtered', filteredUsers.length, 'users from search:', searchTerm);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">User Management</h1>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                console.log('👥 USERS: Opening add dialog');
                setEditingUser(null);
                resetForm();
              }}
              className="bg-orange-500 hover:bg-orange-600"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-800 text-white max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingUser ? 'Edit User' : 'Add New User'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!editingUser && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Email *</Label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      className="bg-slate-700 border-slate-600"
                    />
                  </div>
                  <div>
                    <Label>Password *</Label>
                    <Input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                      minLength={6}
                      className="bg-slate-700 border-slate-600"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Full Name *</Label>
                  <Input
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    required
                    className="bg-slate-700 border-slate-600"
                  />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="bg-slate-700 border-slate-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Role *</Label>
                  <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                    <SelectTrigger className="bg-slate-700 border-slate-600">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="affiliate">Affiliate</SelectItem>
                      <SelectItem value="driver">Driver</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Status *</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                    <SelectTrigger className="bg-slate-700 border-slate-600">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsAddDialogOpen(false);
                    setEditingUser(null);
                    resetForm();
                  }}
                  className="border-slate-600"
                >
                  Cancel
                </Button>
                <Button type="submit" className="bg-orange-500 hover:bg-orange-600">
                  {editingUser ? 'Update' : 'Add'} User
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
              <Input
                placeholder="Search by name, phone, or role..."
                value={searchTerm}
                onChange={(e) => {
                  console.log('👥 USERS: Search term changed:', e.target.value);
                  setSearchTerm(e.target.value);
                }}
                className="pl-10 bg-slate-700 border-slate-600"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-700 text-slate-300 text-xs uppercase">
                <tr>
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">Phone</th>
                  <th className="px-4 py-3 text-left">Role</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-700 text-white">
                    <td className="px-4 py-3 text-sm">{user.full_name}</td>
                    <td className="px-4 py-3 text-sm">{user.phone || '-'}</td>
                    <td className="px-4 py-3 text-sm capitalize">{user.role}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={user.status} type="user" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(user)}
                          className="text-blue-400 hover:text-blue-300 hover:bg-slate-600"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {user.status === 'suspended' ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleApprove(user.id)}
                            className="text-green-400 hover:text-green-300 hover:bg-slate-600"
                          >
                            <UserCheck className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleSuspend(user.id)}
                            className="text-red-400 hover:text-red-300 hover:bg-slate-600"
                          >
                            <UserX className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}