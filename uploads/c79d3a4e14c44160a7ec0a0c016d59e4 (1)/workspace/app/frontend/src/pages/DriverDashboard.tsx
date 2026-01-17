import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { queueOfflineAction, setupAutoSync } from '@/lib/offline-sync-supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import StatusBadge from '@/components/StatusBadge';
import { Truck, MapPin, CheckCircle, Camera } from 'lucide-react';
import { format } from 'date-fns';

export default function DriverDashboard() {
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDelivery, setSelectedDelivery] = useState<any>(null);

  useEffect(() => {
    setupAutoSync();
    loadDeliveries();
  }, []);

  const loadDeliveries = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('deliveries')
        .select('*')
        .eq('driver_id', user.id)
        .in('status', ['PENDING', 'IN_PROGRESS'])
        .order('route_priority', { ascending: true })
        .limit(50);

      setDeliveries(data || []);
    } catch (error) {
      console.error('Error loading deliveries:', error);
    } finally {
      setLoading(false);
    }
  };

  const startDelivery = async (deliveryId: number) => {
    try {
      if (navigator.onLine) {
        await supabase
          .from('deliveries')
          .update({ status: 'IN_PROGRESS' })
          .eq('id', deliveryId);
      } else {
        await queueOfflineAction('delivery_update', {
          id: deliveryId,
          updates: { status: 'IN_PROGRESS' },
        });
      }
      loadDeliveries();
    } catch (error) {
      console.error('Error starting delivery:', error);
    }
  };

  const completeDelivery = async (deliveryId: number) => {
    try {
      if (navigator.onLine) {
        await supabase
          .from('deliveries')
          .update({ 
            status: 'COMPLETED',
            completed_date: new Date().toISOString(),
          })
          .eq('id', deliveryId);
      } else {
        await queueOfflineAction('delivery_update', {
          id: deliveryId,
          updates: { 
            status: 'COMPLETED',
            completed_date: new Date().toISOString(),
          },
        });
      }
      setSelectedDelivery(null);
      loadDeliveries();
    } catch (error) {
      console.error('Error completing delivery:', error);
    }
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
          <p className="text-slate-300">Loading deliveries...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Delivery Queue</h1>
          <Button
            onClick={handleLogout}
            variant="outline"
            size="sm"
            className="border-slate-600 text-slate-300"
          >
            Logout
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-300">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {deliveries.filter(d => d.status === 'PENDING').length}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-300">In Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {deliveries.filter(d => d.status === 'IN_PROGRESS').length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Delivery List */}
        <div className="space-y-4">
          {deliveries.map((delivery) => (
            <Card key={delivery.id} className="bg-slate-800 border-slate-700">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Truck className="w-5 h-5 text-orange-500" />
                      <span className="font-semibold text-lg">Delivery #{delivery.id}</span>
                      <StatusBadge status={delivery.status} type="delivery" />
                    </div>
                    <div className="flex items-start gap-2 text-slate-300">
                      <MapPin className="w-4 h-4 mt-1 flex-shrink-0" />
                      <span className="text-sm">{delivery.delivery_address}</span>
                    </div>
                    <div className="text-xs text-slate-400 mt-2">
                      Scheduled: {delivery.scheduled_date ? format(new Date(delivery.scheduled_date), 'MMM dd, yyyy HH:mm') : '-'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-orange-500">
                      #{delivery.route_priority}
                    </div>
                    <div className="text-xs text-slate-400">Priority</div>
                  </div>
                </div>

                <div className="flex gap-2">
                  {delivery.status === 'PENDING' && (
                    <Button
                      onClick={() => startDelivery(delivery.id)}
                      className="flex-1 bg-orange-500 hover:bg-orange-600 h-12 text-base font-semibold"
                    >
                      Start Delivery
                    </Button>
                  )}
                  {delivery.status === 'IN_PROGRESS' && (
                    <>
                      <Button
                        onClick={() => setSelectedDelivery(delivery)}
                        className="flex-1 bg-blue-500 hover:bg-blue-600 h-12 text-base font-semibold"
                      >
                        <Camera className="w-5 h-5 mr-2" />
                        Capture Proof
                      </Button>
                      <Button
                        onClick={() => completeDelivery(delivery.id)}
                        className="flex-1 bg-green-500 hover:bg-green-600 h-12 text-base font-semibold"
                      >
                        <CheckCircle className="w-5 h-5 mr-2" />
                        Complete
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {deliveries.length === 0 && (
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-12 text-center">
              <Truck className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 text-lg">No deliveries assigned</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}