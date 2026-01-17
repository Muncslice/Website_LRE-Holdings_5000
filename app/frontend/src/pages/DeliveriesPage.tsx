import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import StatusBadge from '@/components/StatusBadge';
import { Search } from 'lucide-react';
import { format } from 'date-fns';

export default function DeliveriesPage() {
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  console.log('🚚 DELIVERIES: Component mounted');

  useEffect(() => {
    loadDeliveries();
  }, []);

  const loadDeliveries = async () => {
    try {
      console.log('🚚 DELIVERIES: Loading data...');
      setLoading(true);
      const { data, error } = await supabase
        .from('deliveries')
        .select('*, users_extended(full_name)')
        .is('deleted_at', null)
        .order('route_priority', { ascending: true });

      if (error) throw error;
      console.log('✅ DELIVERIES: Loaded', data?.length, 'deliveries');
      setDeliveries(data || []);
    } catch (error: any) {
      console.error('❌ DELIVERIES: Load failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredDeliveries = deliveries.filter(
    (d) =>
      d.id?.toString().includes(searchTerm) ||
      d.delivery_address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.users_extended?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Deliveries</h1>

      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
            <Input
              placeholder="Search by ID, address, or driver..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-slate-700 border-slate-600"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-700 text-slate-300 text-xs uppercase">
                <tr>
                  <th className="px-4 py-3 text-left">ID</th>
                  <th className="px-4 py-3 text-left">Driver</th>
                  <th className="px-4 py-3 text-left">Address</th>
                  <th className="px-4 py-3 text-left">Priority</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Scheduled</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {filteredDeliveries.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-700 text-white">
                    <td className="px-4 py-3 text-sm">{d.id}</td>
                    <td className="px-4 py-3 text-sm">{d.users_extended?.full_name || 'N/A'}</td>
                    <td className="px-4 py-3 text-sm">{d.delivery_address}</td>
                    <td className="px-4 py-3 text-sm font-bold text-orange-500">#{d.route_priority}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={d.status} type="delivery" />
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {d.scheduled_date ? format(new Date(d.scheduled_date), 'MMM dd, yyyy HH:mm') : '-'}
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