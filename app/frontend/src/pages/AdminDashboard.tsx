import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import StatusBadge from '@/components/StatusBadge';
import { Package, Users, Truck, DollarSign } from 'lucide-react';

export default function AdminDashboard() {
  const [inventory, setInventory] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalInventory: 0,
    warehouseCount: 0,
    consignedCount: 0,
    soldCount: 0,
    totalAffiliates: 0,
    activeDeliveries: 0,
  });
  const [loading, setLoading] = useState(true);

  console.log('🏠 ADMIN DASHBOARD: Component mounted');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      console.log('🏠 ADMIN DASHBOARD: Loading data...');
      setLoading(true);

      // Load inventory
      const { data: inventoryData } = await supabase
        .from('inventory')
        .select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(100);
      console.log('✅ ADMIN DASHBOARD: Inventory loaded:', inventoryData?.length);
      setInventory(inventoryData || []);

      // Load users
      const { data: usersData } = await supabase
        .from('users_extended')
        .select('*')
        .is('deleted_at', null)
        .limit(100);
      console.log('✅ ADMIN DASHBOARD: Users loaded:', usersData?.length);
      setUsers(usersData || []);

      // Load audit logs
      const { data: logsData } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      console.log('✅ ADMIN DASHBOARD: Audit logs loaded:', logsData?.length);
      setAuditLogs(logsData || []);

      // Calculate stats
      const warehouseCount = inventoryData?.filter(i => i.status === 'WAREHOUSE').length || 0;
      const consignedCount = inventoryData?.filter(i => i.status === 'CONSIGNED').length || 0;
      const soldCount = inventoryData?.filter(i => i.status === 'SOLD').length || 0;
      const totalAffiliates = usersData?.filter(u => u.role === 'affiliate').length || 0;

      const { count: activeDeliveriesCount } = await supabase
        .from('deliveries')
        .select('*', { count: 'exact', head: true })
        .in('status', ['PENDING', 'IN_PROGRESS']);

      setStats({
        totalInventory: inventoryData?.length || 0,
        warehouseCount,
        consignedCount,
        soldCount,
        totalAffiliates,
        activeDeliveries: activeDeliveriesCount || 0,
      });

      console.log('✅ ADMIN DASHBOARD: Stats calculated:', stats);
    } catch (error) {
      console.error('❌ ADMIN DASHBOARD: Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-slate-300">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">
              Total Inventory
            </CardTitle>
            <Package className="w-4 h-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.totalInventory}</div>
            <p className="text-xs text-slate-400 mt-1">
              Warehouse: {stats.warehouseCount} | Consigned: {stats.consignedCount}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">
              Total Affiliates
            </CardTitle>
            <Users className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.totalAffiliates}</div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">
              Active Deliveries
            </CardTitle>
            <Truck className="w-4 h-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.activeDeliveries}</div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">
              Items Sold
            </CardTitle>
            <DollarSign className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.soldCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Inventory Table */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Inventory Overview</CardTitle>
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
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {inventory.slice(0, 10).map((item) => (
                  <tr key={item.id} className="hover:bg-slate-700 text-white">
                    <td className="px-4 py-3 text-sm font-mono">{item.sku}</td>
                    <td className="px-4 py-3 text-sm">{item.product_name}</td>
                    <td className="px-4 py-3 text-sm">{item.category}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={item.status} type="inventory" />
                    </td>
                    <td className="px-4 py-3 text-sm">{item.location}</td>
                    <td className="px-4 py-3 text-sm font-semibold">
                      ${item.retail_price?.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Recent Audit Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-700 text-slate-300 text-xs uppercase">
                <tr>
                  <th className="px-4 py-3 text-left">Table</th>
                  <th className="px-4 py-3 text-left">Action</th>
                  <th className="px-4 py-3 text-left">Record ID</th>
                  <th className="px-4 py-3 text-left">User</th>
                  <th className="px-4 py-3 text-left">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {auditLogs.slice(0, 10).map((log: any) => (
                  <tr key={log.id} className="hover:bg-slate-700 text-white">
                    <td className="px-4 py-3 text-sm">{log.table_name}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        log.action === 'INSERT' ? 'bg-green-500/20 text-green-400' :
                        log.action === 'UPDATE' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-mono">{log.record_id}</td>
                    <td className="px-4 py-3 text-sm">{log.user_id}</td>
                    <td className="px-4 py-3 text-sm">{log.created_at}</td>
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