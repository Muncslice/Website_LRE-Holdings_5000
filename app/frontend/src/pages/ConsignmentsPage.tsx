import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import StatusBadge from '@/components/StatusBadge';
import { Search } from 'lucide-react';
import { format } from 'date-fns';

export default function ConsignmentsPage() {
  const [consignments, setConsignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  console.log('📋 CONSIGNMENTS: Component mounted');

  useEffect(() => {
    loadConsignments();
  }, []);

  const loadConsignments = async () => {
    try {
      console.log('📋 CONSIGNMENTS: Loading data...');
      setLoading(true);
      const { data, error } = await supabase
        .from('consignments')
        .select('*, users_extended(full_name), inventory(product_name)')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      console.log('✅ CONSIGNMENTS: Loaded', data?.length, 'consignments');
      setConsignments(data || []);
    } catch (error: any) {
      console.error('❌ CONSIGNMENTS: Load failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredConsignments = consignments.filter(
    (c) =>
      c.id?.toString().includes(searchTerm) ||
      c.users_extended?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
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
      <h1 className="text-3xl font-bold text-white">Consignments</h1>

      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
            <Input
              placeholder="Search by ID or affiliate name..."
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
                  <th className="px-4 py-3 text-left">Affiliate</th>
                  <th className="px-4 py-3 text-left">Product</th>
                  <th className="px-4 py-3 text-left">Quantity</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {filteredConsignments.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-700 text-white">
                    <td className="px-4 py-3 text-sm">{c.id}</td>
                    <td className="px-4 py-3 text-sm">{c.users_extended?.full_name || 'N/A'}</td>
                    <td className="px-4 py-3 text-sm">{c.inventory?.product_name || 'N/A'}</td>
                    <td className="px-4 py-3 text-sm">{c.quantity}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={c.status} type="consignment" />
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {c.consigned_date ? format(new Date(c.consigned_date), 'MMM dd, yyyy') : '-'}
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