import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, TrendingUp, Package, DollarSign } from 'lucide-react';

export default function ReportsPage() {
  const [stats, setStats] = useState({
    totalInventory: 0,
    totalRevenue: 0,
    activeConsignments: 0,
    pendingDeliveries: 0,
  });
  const [loading, setLoading] = useState(true);

  console.log('📊 REPORTS: Component mounted');

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      console.log('📊 REPORTS: Loading report data...');
      setLoading(true);

      const [inventoryRes, paymentsRes, consignmentsRes, deliveriesRes] = await Promise.all([
        supabase.from('inventory').select('*', { count: 'exact', head: true }),
        supabase.from('payments').select('amount').eq('status', 'COMPLETED'),
        supabase.from('consignments').select('*', { count: 'exact', head: true }).in('status', ['PENDING', 'CONFIRMED']),
        supabase.from('deliveries').select('*', { count: 'exact', head: true }).in('status', ['PENDING', 'IN_PROGRESS']),
      ]);

      const totalRevenue = paymentsRes.data?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

      setStats({
        totalInventory: inventoryRes.count || 0,
        totalRevenue,
        activeConsignments: consignmentsRes.count || 0,
        pendingDeliveries: deliveriesRes.count || 0,
      });

      console.log('✅ REPORTS: Stats loaded:', stats);
    } catch (error: any) {
      console.error('❌ REPORTS: Load failed:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Reports & Analytics</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Total Inventory</CardTitle>
            <Package className="w-4 h-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.totalInventory}</div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Total Revenue</CardTitle>
            <DollarSign className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">${stats.totalRevenue.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Active Consignments</CardTitle>
            <TrendingUp className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.activeConsignments}</div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Pending Deliveries</CardTitle>
            <BarChart3 className="w-4 h-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.pendingDeliveries}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">System Overview</CardTitle>
        </CardHeader>
        <CardContent className="text-slate-300">
          <p>Comprehensive reporting and analytics dashboard coming soon...</p>
        </CardContent>
      </Card>
    </div>
  );
}