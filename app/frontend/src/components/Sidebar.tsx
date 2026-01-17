import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  LayoutDashboard,
  Package,
  Users,
  Truck,
  FileText,
  DollarSign,
  AlertCircle,
  BarChart3,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

interface SidebarProps {
  userRole: string;
}

export default function Sidebar({ userRole }: SidebarProps) {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(true);

  console.log('🎨 SIDEBAR: Rendering sidebar for role:', userRole, 'at path:', location.pathname);

  const handleLogout = async () => {
    console.log('🚪 SIDEBAR: Logout initiated');
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  const adminMenuItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/inventory', icon: Package, label: 'Inventory' },
    { path: '/users', icon: Users, label: 'Users' },
    { path: '/consignments', icon: FileText, label: 'Consignments' },
    { path: '/deliveries', icon: Truck, label: 'Deliveries' },
    { path: '/payments', icon: DollarSign, label: 'Payments' },
    { path: '/issues', icon: AlertCircle, label: 'Issues' },
    { path: '/reports', icon: BarChart3, label: 'Reports' },
  ];

  const affiliateMenuItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/my-consignments', icon: FileText, label: 'My Consignments' },
    { path: '/my-payments', icon: DollarSign, label: 'My Payments' },
    { path: '/my-issues', icon: AlertCircle, label: 'My Issues' },
  ];

  const driverMenuItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/my-deliveries', icon: Truck, label: 'My Deliveries' },
  ];

  const menuItems =
    userRole === 'admin'
      ? adminMenuItems
      : userRole === 'affiliate'
      ? affiliateMenuItems
      : driverMenuItems;

  return (
    <>
      {/* Mobile Toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 lg:hidden bg-slate-800 text-white hover:bg-slate-700"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-40 h-screen bg-slate-800 border-r border-slate-700 transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
        style={{ width: '260px' }}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-slate-700">
            <h2 className="text-xl font-bold text-white">LRE HOLDINGS</h2>
            <p className="text-xs text-slate-400 mt-1">
              {userRole === 'admin' ? 'Admin Portal' : userRole === 'affiliate' ? 'Affiliate Portal' : 'Driver Portal'}
            </p>
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 px-3 py-4">
            <nav className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                console.log(`🎨 SIDEBAR: Menu item ${item.label} - path: ${item.path}, active: ${isActive}`);
                
                return (
                  <Link key={item.path} to={item.path}>
                    <Button
                      variant={isActive ? 'secondary' : 'ghost'}
                      className={`w-full justify-start ${
                        isActive
                          ? 'bg-orange-500 text-white hover:bg-orange-600'
                          : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                      }`}
                    >
                      <Icon className="mr-3 h-4 w-4" />
                      {item.label}
                    </Button>
                  </Link>
                );
              })}
            </nav>
          </ScrollArea>

          <Separator className="bg-slate-700" />

          {/* Logout */}
          <div className="p-3">
            <Button
              variant="ghost"
              className="w-full justify-start text-slate-300 hover:bg-slate-700 hover:text-white"
              onClick={handleLogout}
            >
              <LogOut className="mr-3 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}