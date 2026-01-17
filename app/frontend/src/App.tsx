import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase, getUserRole } from './lib/supabase';
import OfflineIndicator from './components/OfflineIndicator';
import DashboardLayout from './components/DashboardLayout';
import Login from './pages/Login';
import AuthCallback from './pages/AuthCallback';
import AffiliateDashboard from './pages/AffiliateDashboard';
import AdminDashboard from './pages/AdminDashboard';
import DriverDashboard from './pages/DriverDashboard';
import InventoryPage from './pages/InventoryPage';
import UsersPage from './pages/UsersPage';
import ConsignmentsPage from './pages/ConsignmentsPage';
import DeliveriesPage from './pages/DeliveriesPage';
import PaymentsPage from './pages/PaymentsPage';
import IssuesPage from './pages/IssuesPage';
import ReportsPage from './pages/ReportsPage';
import { Toaster } from './components/ui/toaster';

console.log('🚀 APP: Application initializing...');

function App() {
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('🔄 APP: useEffect triggered - checking auth');
    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 APP: Auth state changed - event:', event, 'user:', session?.user?.id);
      if (session?.user) {
        setUser(session.user);
        const role = await getUserRole();
        console.log('🔄 APP: User role retrieved:', role);
        setUserRole(role);
      } else {
        console.log('🔄 APP: No user session');
        setUser(null);
        setUserRole(null);
      }
    });

    return () => {
      console.log('🔄 APP: Cleaning up auth subscription');
      subscription.unsubscribe();
    };
  }, []);

  const checkAuth = async () => {
    try {
      console.log('🔐 APP: Checking authentication...');
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      console.log('🔐 APP: Current user:', currentUser?.id);
      
      if (currentUser) {
        setUser(currentUser);
        const role = await getUserRole();
        console.log('🔐 APP: User role:', role);
        setUserRole(role);
      } else {
        console.log('🔐 APP: No authenticated user');
      }
    } catch (error) {
      console.error('❌ APP: Auth check failed:', error);
    } finally {
      setLoading(false);
      console.log('✅ APP: Auth check complete');
    }
  };

  if (loading) {
    console.log('⏳ APP: Loading...');
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-slate-300">Loading...</p>
        </div>
      </div>
    );
  }

  console.log('🎨 APP: Rendering routes - user:', user?.id, 'role:', userRole);

  return (
    <Router>
      <OfflineIndicator />
      <Routes>
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        
        <Route
          path="/"
          element={
            !user ? (
              <Navigate to="/login" />
            ) : !userRole ? (
              <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <div className="text-center text-white">
                  <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
                  <p className="text-slate-400">Your account is pending approval.</p>
                </div>
              </div>
            ) : userRole === 'admin' ? (
              <DashboardLayout userRole={userRole}>
                <AdminDashboard />
              </DashboardLayout>
            ) : userRole === 'affiliate' ? (
              <DashboardLayout userRole={userRole}>
                <AffiliateDashboard />
              </DashboardLayout>
            ) : userRole === 'driver' ? (
              <DashboardLayout userRole={userRole}>
                <DriverDashboard />
              </DashboardLayout>
            ) : (
              <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <div className="text-center text-white">
                  <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
                  <p className="text-slate-400">Your account role is not recognized.</p>
                </div>
              </div>
            )
          }
        />

        {/* Admin Routes */}
        {userRole === 'admin' && (
          <>
            <Route path="/inventory" element={<DashboardLayout userRole={userRole}><InventoryPage /></DashboardLayout>} />
            <Route path="/users" element={<DashboardLayout userRole={userRole}><UsersPage /></DashboardLayout>} />
            <Route path="/consignments" element={<DashboardLayout userRole={userRole}><ConsignmentsPage /></DashboardLayout>} />
            <Route path="/deliveries" element={<DashboardLayout userRole={userRole}><DeliveriesPage /></DashboardLayout>} />
            <Route path="/payments" element={<DashboardLayout userRole={userRole}><PaymentsPage /></DashboardLayout>} />
            <Route path="/issues" element={<DashboardLayout userRole={userRole}><IssuesPage /></DashboardLayout>} />
            <Route path="/reports" element={<DashboardLayout userRole={userRole}><ReportsPage /></DashboardLayout>} />
          </>
        )}
      </Routes>
      <Toaster />
    </Router>
  );
}

export default App;