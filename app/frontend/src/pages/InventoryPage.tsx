import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import StatusBadge from '@/components/StatusBadge';
import { Plus, Edit, Trash2, Search, Barcode } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function InventoryPage() {
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    sku: '',
    product_name: '',
    description: '',
    category: '',
    unit_cost: '',
    retail_price: '',
    status: 'WAREHOUSE',
    location: '',
    barcode: '',
  });

  console.log('📦 INVENTORY: Component mounted');

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    try {
      console.log('📦 INVENTORY: Loading inventory data...');
      setLoading(true);
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ INVENTORY: Error loading inventory:', error);
        throw error;
      }

      console.log('✅ INVENTORY: Loaded', data?.length, 'items');
      setInventory(data || []);
    } catch (error: any) {
      console.error('❌ INVENTORY: Load failed:', error);
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
    console.log('📦 INVENTORY: Submitting form...', editingItem ? 'UPDATE' : 'INSERT');

    try {
      const payload = {
        ...formData,
        unit_cost: parseFloat(formData.unit_cost),
        retail_price: parseFloat(formData.retail_price),
      };

      console.log('📦 INVENTORY: Payload:', payload);

      if (editingItem) {
        const { error } = await supabase
          .from('inventory')
          .update(payload)
          .eq('id', editingItem.id);

        if (error) throw error;
        console.log('✅ INVENTORY: Item updated successfully');
        toast({ title: 'Success', description: 'Item updated successfully' });
      } else {
        const { error } = await supabase
          .from('inventory')
          .insert([payload]);

        if (error) throw error;
        console.log('✅ INVENTORY: Item added successfully');
        toast({ title: 'Success', description: 'Item added successfully' });
      }

      setIsAddDialogOpen(false);
      setEditingItem(null);
      resetForm();
      loadInventory();
    } catch (error: any) {
      console.error('❌ INVENTORY: Submit failed:', error);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (item: any) => {
    console.log('📦 INVENTORY: Editing item:', item.id);
    setEditingItem(item);
    setFormData({
      sku: item.sku,
      product_name: item.product_name,
      description: item.description || '',
      category: item.category || '',
      unit_cost: item.unit_cost.toString(),
      retail_price: item.retail_price.toString(),
      status: item.status,
      location: item.location || '',
      barcode: item.barcode || '',
    });
    setIsAddDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    console.log('📦 INVENTORY: Deleting item:', id);
    try {
      const { error } = await supabase
        .from('inventory')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      console.log('✅ INVENTORY: Item deleted successfully');
      toast({ title: 'Success', description: 'Item deleted successfully' });
      loadInventory();
    } catch (error: any) {
      console.error('❌ INVENTORY: Delete failed:', error);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    console.log('📦 INVENTORY: Resetting form');
    setFormData({
      sku: '',
      product_name: '',
      description: '',
      category: '',
      unit_cost: '',
      retail_price: '',
      status: 'WAREHOUSE',
      location: '',
      barcode: '',
    });
  };

  const filteredInventory = inventory.filter(
    (item) =>
      item.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  console.log('📦 INVENTORY: Filtered', filteredInventory.length, 'items from search:', searchTerm);

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
        <h1 className="text-3xl font-bold text-white">Inventory Management</h1>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                console.log('📦 INVENTORY: Opening add dialog');
                setEditingItem(null);
                resetForm();
              }}
              className="bg-orange-500 hover:bg-orange-600"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-800 text-white max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingItem ? 'Edit Item' : 'Add New Item'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>SKU *</Label>
                  <Input
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    required
                    className="bg-slate-700 border-slate-600"
                  />
                </div>
                <div>
                  <Label>Product Name *</Label>
                  <Input
                    value={formData.product_name}
                    onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
                    required
                    className="bg-slate-700 border-slate-600"
                  />
                </div>
              </div>

              <div>
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="bg-slate-700 border-slate-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Category</Label>
                  <Input
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="bg-slate-700 border-slate-600"
                  />
                </div>
                <div>
                  <Label>Barcode</Label>
                  <Input
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    className="bg-slate-700 border-slate-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Unit Cost *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.unit_cost}
                    onChange={(e) => setFormData({ ...formData, unit_cost: e.target.value })}
                    required
                    className="bg-slate-700 border-slate-600"
                  />
                </div>
                <div>
                  <Label>Retail Price *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.retail_price}
                    onChange={(e) => setFormData({ ...formData, retail_price: e.target.value })}
                    required
                    className="bg-slate-700 border-slate-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Status *</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                    <SelectTrigger className="bg-slate-700 border-slate-600">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="WAREHOUSE">Warehouse</SelectItem>
                      <SelectItem value="TRANSIT">Transit</SelectItem>
                      <SelectItem value="CONSIGNED">Consigned</SelectItem>
                      <SelectItem value="SOLD">Sold</SelectItem>
                      <SelectItem value="RETURNED">Returned</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Location</Label>
                  <Input
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="bg-slate-700 border-slate-600"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsAddDialogOpen(false);
                    setEditingItem(null);
                    resetForm();
                  }}
                  className="border-slate-600"
                >
                  Cancel
                </Button>
                <Button type="submit" className="bg-orange-500 hover:bg-orange-600">
                  {editingItem ? 'Update' : 'Add'} Item
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
                placeholder="Search by SKU, name, or category..."
                value={searchTerm}
                onChange={(e) => {
                  console.log('📦 INVENTORY: Search term changed:', e.target.value);
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
                  <th className="px-4 py-3 text-left">SKU</th>
                  <th className="px-4 py-3 text-left">Product</th>
                  <th className="px-4 py-3 text-left">Category</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Location</th>
                  <th className="px-4 py-3 text-left">Price</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {filteredInventory.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-700 text-white">
                    <td className="px-4 py-3 text-sm font-mono">{item.sku}</td>
                    <td className="px-4 py-3 text-sm">{item.product_name}</td>
                    <td className="px-4 py-3 text-sm">{item.category}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={item.status} type="inventory" />
                    </td>
                    <td className="px-4 py-3 text-sm">{item.location}</td>
                    <td className="px-4 py-3 text-sm font-semibold">${item.retail_price?.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(item)}
                          className="text-blue-400 hover:text-blue-300 hover:bg-slate-600"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(item.id)}
                          className="text-red-400 hover:text-red-300 hover:bg-slate-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
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