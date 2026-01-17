import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase, getUserRole } from './lib/supabase';
import OfflineIndicator from './components/OfflineIndicator';
import Login from './pages/Login';
import AuthCallback from './pages/AuthCallback';
import AffiliateDashboard from './pages/AffiliateDashboard';
import AdminDashboard from './pages/AdminDashboard';
import DriverDashboard from './pages/DriverDashboard';
import { Toaster } from './components/ui/toaster';

function App() {
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);
        const role = await getUserRole();
        setUserRole(role);
      } else {
        setUser(null);
        setUserRole(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser) {
        setUser(currentUser);
        const role = await getUserRole();
        setUserRole(role);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-slate-300">Loading...</p>
        </div>
      </div>
    );
  }

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
            ) : userRole === 'admin' ? (
              <AdminDashboard />
            ) : userRole === 'affiliate' ? (
              <AffiliateDashboard />
            ) : userRole === 'driver' ? (
              <DriverDashboard />
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
      </Routes>
      <Toaster />
    </Router>
  );
}

export default App;