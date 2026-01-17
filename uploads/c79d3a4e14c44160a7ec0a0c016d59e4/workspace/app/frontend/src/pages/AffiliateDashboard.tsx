import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import StatusBadge from '@/components/StatusBadge';
import CSVButton from '@/components/CSVButton';
import { Package, AlertCircle, DollarSign, FileText } from 'lucide-react';
import { format } from 'date-fns';

export default function AffiliateDashboard() {
  const [consignments, setConsignments] = useState<any[]>([]);
  const [issues, setIssues] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load consignments
      const { data: consignmentsData } = await supabase
        .from('consignments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);
      setConsignments(consignmentsData || []);

      // Load issues
      const { data: issuesData } = await supabase
        .from('issues')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      setIssues(issuesData || []);

      // Load payments
      const { data: paymentsData } = await supabase
        .from('payments')
        .select('*')
        .eq('user_id', user.id)
        .order('payment_date', { ascending: false })
        .limit(100);
      setPayments(paymentsData || []);

    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateNetProfitability = () => {
    const sales = payments
      .filter(p => p.payment_type === 'SALE' && p.status === 'COMPLETED')
      .reduce((sum, p) => sum + (p.amount || 0), 0);
    
    const returns = payments
      .filter(p => p.payment_type === 'RETURN' && p.status === 'COMPLETED')
      .reduce((sum, p) => sum + (p.amount || 0), 0);
    
    return sales - returns;
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-slate-300">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Affiliate Dashboard</h1>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="border-slate-600 text-slate-300 hover:bg-slate-800"
          >
            Logout
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">
                Active Consignments
              </CardTitle>
              <Package className="w-4 h-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{consignments.length}</div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">
                Open Issues
              </CardTitle>
              <AlertCircle className="w-4 h-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {issues.filter(i => i.status === 'OPEN').length}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">
                Net Profitability
              </CardTitle>
              <DollarSign className="w-4 h-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${calculateNetProfitability().toFixed(2)}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">
                Total Payments
              </CardTitle>
              <FileText className="w-4 h-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{payments.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Consignments Table */}
        <Card className="bg-slate-800 border-slate-700 mb-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>My Consignments</CardTitle>
            <CSVButton
              data={consignments}
              filename="consignments"
              headers={['id', 'inventory_id', 'quantity', 'status', 'consigned_date']}
            />
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-700 text-slate-300 text-xs uppercase">
                  <tr>
                    <th className="px-4 py-3 text-left">ID</th>
                    <th className="px-4 py-3 text-left">Inventory</th>
                    <th className="px-4 py-3 text-left">Quantity</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {consignments.map((consignment) => (
                    <tr key={consignment.id} className="hover:bg-slate-700">
                      <td className="px-4 py-3 text-sm">{consignment.id}</td>
                      <td className="px-4 py-3 text-sm">{consignment.inventory_id}</td>
                      <td className="px-4 py-3 text-sm">{consignment.quantity}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={consignment.status} type="consignment" />
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {consignment.consigned_date ? format(new Date(consignment.consigned_date), 'MMM dd, yyyy') : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Financial Statements */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Financial Statements</CardTitle>
            <CSVButton
              data={payments}
              filename="financial-statements"
              headers={['id', 'amount', 'payment_type', 'status', 'payment_date']}
            />
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-700 text-slate-300 text-xs uppercase">
                  <tr>
                    <th className="px-4 py-3 text-left">ID</th>
                    <th className="px-4 py-3 text-left">Amount</th>
                    <th className="px-4 py-3 text-left">Type</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {payments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-slate-700">
                      <td className="px-4 py-3 text-sm">{payment.id}</td>
                      <td className="px-4 py-3 text-sm font-semibold">
                        ${payment.amount?.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-sm">{payment.payment_type}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={payment.status} type="payment" />
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {payment.payment_date ? format(new Date(payment.payment_date), 'MMM dd, yyyy') : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}