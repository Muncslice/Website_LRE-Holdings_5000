import { ReactNode } from 'react';
import Sidebar from './Sidebar';

interface DashboardLayoutProps {
  children: ReactNode;
  userRole: string;
}

export default function DashboardLayout({ children, userRole }: DashboardLayoutProps) {
  console.log('📐 LAYOUT: Rendering dashboard layout for role:', userRole);
  
  return (
    <div className="min-h-screen bg-slate-900">
      <Sidebar userRole={userRole} />
      <main className="lg:pl-[260px]">
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}