import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import StatusBadge from '@/components/StatusBadge';
import { Search } from 'lucide-react';
import { format } from 'date-fns';

export default function PaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  console.log('💰 PAYMENTS: Component mounted');

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    try {
      console.log('💰 PAYMENTS: Loading data...');
      setLoading(true);
      const { data, error } = await supabase
        .from('payments')
        .select('*, users_extended(full_name)')
        .is('deleted_at', null)
        .order('payment_date', { ascending: false });

      if (error) throw error;
      console.log('✅ PAYMENTS: Loaded', data?.length, 'payments');
      setPayments(data || []);
    } catch (error: any) {
      console.error('❌ PAYMENTS: Load failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPayments = payments.filter(
    (p) =>
      p.id?.toString().includes(searchTerm) ||
      p.users_extended?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
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
      <h1 className="text-3xl font-bold text-white">Payments</h1>

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
                  <th className="px-4 py-3 text-left">Amount</th>
                  <th className="px-4 py-3 text-left">Type</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {filteredPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-700 text-white">
                    <td className="px-4 py-3 text-sm">{p.id}</td>
                    <td className="px-4 py-3 text-sm">{p.users_extended?.full_name || 'N/A'}</td>
                    <td className="px-4 py-3 text-sm font-semibold">${p.amount?.toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm">{p.payment_type}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={p.status} type="payment" />
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {p.payment_date ? format(new Date(p.payment_date), 'MMM dd, yyyy') : '-'}
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