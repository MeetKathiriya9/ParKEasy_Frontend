import { useState, type ReactNode } from 'react';
import { useApp, type Page } from '@/context/AppContext';
import type { Role } from '@/types';
import {
  LayoutDashboard, Search, CalendarCheck, Clock, History, Car, Bell,
  Star, MessageSquare, QrCode, ScanLine, AlertTriangle, ParkingSquare,
  Building2, DollarSign, Users, BarChart3, CalendarDays, Settings,
  FileText, Shield, LogOut, Menu, X, Zap,
} from 'lucide-react';

interface NavItem {
  page: Page;
  label: string;
  icon: ReactNode;
}

const navConfig: Record<Role, { groups: { title: string; items: NavItem[] }[] }> = {
  driver: {
    groups: [
      {
        title: 'Main',
        items: [
          { page: 'driver-dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
          { page: 'driver-search', label: 'Find Parking', icon: <Search size={18} /> },
          { page: 'driver-session', label: 'Active Session', icon: <Clock size={18} /> },
          { page: 'driver-reservations', label: 'My Reservations', icon: <CalendarCheck size={18} /> },
          { page: 'driver-history', label: 'History', icon: <History size={18} /> },
        ],
      },
      {
        title: 'Account',
        items: [
          { page: 'driver-vehicles', label: 'My Vehicles', icon: <Car size={18} /> },
          { page: 'driver-notifications', label: 'Notifications', icon: <Bell size={18} /> },
          { page: 'driver-reviews', label: 'My Reviews', icon: <Star size={18} /> },
          { page: 'driver-complaints', label: 'Complaints', icon: <MessageSquare size={18} /> },
        ],
      },
    ],
  },
  staff: {
    groups: [
      {
        title: 'Operations',
        items: [
          { page: 'staff-dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
          { page: 'staff-scanner', label: 'QR Scanner', icon: <ScanLine size={18} /> },
          { page: 'staff-sessions', label: 'Active Sessions', icon: <Clock size={18} /> },
          { page: 'staff-violations', label: 'Violations', icon: <AlertTriangle size={18} /> },
          { page: 'staff-spaces', label: 'Space Status', icon: <ParkingSquare size={18} /> },
          { page: 'staff-activity', label: 'My Activity', icon: <History size={18} /> },
        ],
      },
    ],
  },
  operator: {
    groups: [
      {
        title: 'Management',
        items: [
          { page: 'operator-dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
          { page: 'operator-facilities', label: 'Facilities', icon: <Building2 size={18} /> },
          { page: 'operator-spaces', label: 'Spaces', icon: <ParkingSquare size={18} /> },
          { page: 'operator-pricing', label: 'Pricing', icon: <DollarSign size={18} /> },
          { page: 'operator-staff', label: 'Staff', icon: <Users size={18} /> },
          { page: 'operator-reservations', label: 'Reservations', icon: <CalendarCheck size={18} /> },
        ],
      },
      {
        title: 'Insights',
        items: [
          { page: 'operator-analytics', label: 'Analytics', icon: <BarChart3 size={18} /> },
          { page: 'operator-events', label: 'Event Parking', icon: <CalendarDays size={18} /> },
          { page: 'operator-complaints', label: 'Complaints', icon: <MessageSquare size={18} /> },
          { page: 'operator-violations', label: 'Violations', icon: <AlertTriangle size={18} /> },
        ],
      },
    ],
  },
  admin: {
    groups: [
      {
        title: 'Platform',
        items: [
          { page: 'admin-dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
          { page: 'admin-users', label: 'Users', icon: <Users size={18} /> },
          { page: 'admin-facilities', label: 'Facilities', icon: <Building2 size={18} /> },
          { page: 'admin-payments', label: 'Payments', icon: <DollarSign size={18} /> },
          { page: 'admin-complaints', label: 'Complaints', icon: <MessageSquare size={18} /> },
        ],
      },
      {
        title: 'System',
        items: [
          { page: 'admin-audit', label: 'Audit Logs', icon: <FileText size={18} /> },
          { page: 'admin-config', label: 'Configuration', icon: <Settings size={18} /> },
        ],
      },
    ],
  },
};

export function AppLayout({ children }: { children: ReactNode }) {
  const { currentUser, currentPage, navigate, logout } = useApp();
  const role = currentUser?.role ?? 'driver';
  const config = navConfig[role];
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-[#0b1220]">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 flex-col bg-[#111a2e] border-r border-[#1e2d4d] flex-shrink-0">
        <div className="flex items-center gap-2.5 px-5 py-5 border-b border-[#1e2d4d]">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#2563eb] to-[#06b6d4] flex items-center justify-center">
            <Zap size={20} className="text-white" />
          </div>
          <div>
            <p className="font-bold text-base leading-tight">ParkEasy</p>
            <p className="text-[10px] text-[#5a6a8a] uppercase tracking-wider">{role} portal</p>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          {config.groups.map((group) => (
            <div key={group.title} className="mb-6">
              <p className="text-[10px] font-bold text-[#5a6a8a] uppercase tracking-wider px-3 mb-2">{group.title}</p>
              <div className="space-y-1">
                {group.items.map((item) => (
                  <button
                    key={item.page}
                    onClick={() => navigate(item.page)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      currentPage === item.page
                        ? 'bg-[#2563eb] text-white'
                        : 'text-[#8a98b5] hover:bg-[#1e2d4d] hover:text-[#e8edf5]'
                    }`}
                  >
                    {item.icon}
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>
        <div className="p-3 border-t border-[#1e2d4d]">
          <button
            onClick={() => {
              void logout();
            }}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-[#ef4444] hover:bg-[#ef4444]/10 transition-colors"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-7xl mx-auto pe-fade-in">{children}</div>
        </main>
      </div>
    </div>
  );
}

function TopBar() {
  const { currentUser, currentPage, navigate } = useApp();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const role = currentUser?.role ?? 'driver';
  const config = navConfig[role];

  return (
    <>
      <header className="flex items-center justify-between px-4 md:px-6 py-3 bg-[#111a2e] border-b border-[#1e2d4d] flex-shrink-0">
        <div className="flex items-center gap-3">
          <button className="md:hidden text-[#8a98b5]" onClick={() => setMobileNavOpen(!mobileNavOpen)}>
            {mobileNavOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
          <div className="md:hidden flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#2563eb] to-[#06b6d4] flex items-center justify-center">
              <Zap size={16} className="text-white" />
            </div>
            <span className="font-bold text-sm">ParkEasy</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(role === 'driver' ? 'driver-notifications' : role === 'staff' ? 'staff-dashboard' : role === 'operator' ? 'operator-dashboard' : 'admin-dashboard')} className="relative w-9 h-9 rounded-lg bg-[#1e2d4d] flex items-center justify-center text-[#8a98b5] hover:text-[#e8edf5] transition-colors">
            <Bell size={18} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#ef4444]" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#2563eb] to-[#06b6d4] flex items-center justify-center font-bold text-white text-sm">
              {currentUser?.avatar}
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-semibold leading-tight">{currentUser?.name}</p>
              <p className="text-[10px] text-[#5a6a8a] capitalize">{currentUser?.role}</p>
            </div>
          </div>
        </div>
      </header>

      {mobileNavOpen && (
        <div className="md:hidden absolute inset-0 z-40 bg-[#0b1220]/80 backdrop-blur-sm" onClick={() => setMobileNavOpen(false)}>
          <div className="absolute left-0 top-0 bottom-0 w-64 bg-[#111a2e] border-r border-[#1e2d4d] pe-fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="px-5 py-5 border-b border-[#1e2d4d]">
              <p className="font-bold">ParkEasy</p>
              <p className="text-[10px] text-[#5a6a8a] uppercase tracking-wider">{role} portal</p>
            </div>
            <nav className="py-4 px-3">
              {config.groups.map((group) => (
                <div key={group.title} className="mb-4">
                  <p className="text-[10px] font-bold text-[#5a6a8a] uppercase tracking-wider px-3 mb-2">{group.title}</p>
                  <div className="space-y-1">
                    {group.items.map((item) => (
                      <button
                        key={item.page}
                        onClick={() => { navigate(item.page); setMobileNavOpen(false); }}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium ${
                          currentPage === item.page ? 'bg-[#2563eb] text-white' : 'text-[#8a98b5] hover:bg-[#1e2d4d]'
                        }`}
                      >
                        {item.icon}
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
