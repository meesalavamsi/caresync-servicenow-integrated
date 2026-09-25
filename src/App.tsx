import React, { useState, useEffect } from 'react';
import { UserSession, NavTab, CareSyncTicket, SystemNotification } from './types';
import { EnterpriseLogin } from './components/auth/EnterpriseLogin';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { MainDashboard } from './components/dashboard/MainDashboard';
import { RaiseTicketView } from './components/tickets/RaiseTicketView';
import { TicketDetailsView } from './components/tickets/TicketDetailsView';
import { MyTicketsView } from './components/tickets/MyTicketsView';
import { ITSupportDashboard } from './components/tickets/ITSupportDashboard';
import { AdminDashboard } from './components/tickets/AdminDashboard';
import { NotificationsView } from './components/tickets/NotificationsView';
import { api } from './services/api';

export function App() {
  const [user, setUser] = useState<UserSession | null>(null);
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [tickets, setTickets] = useState<CareSyncTicket[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [loading, setLoading] = useState(false);

  // Load initial demo session for fast developer feedback
  useEffect(() => {
    const defaultUser: UserSession = {
      sys_id: 'usr_doc',
      userId: 'CS-DOC01',
      name: 'Dr. Sarah Jenkins',
      email: 'sarah.jenkins@caresync.org',
      role: 'doctor',
      dept: 'Radiology'
    };
    setUser(defaultUser);
  }, []);

  // Fetch tickets and notifications whenever user changes or tab re-loads
  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const ticketsRes = await api.getTickets();
      if (ticketsRes.success && ticketsRes.tickets) {
        setTickets(ticketsRes.tickets);
      }

      const notifRes = await api.getNotifications();
      if (notifRes.success && notifRes.notifications) {
        setNotifications(notifRes.notifications);
      }
    } catch (err) {
      console.warn('[CareSync Data Fetch Warning]:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleTicketCreated = (newTicket: CareSyncTicket) => {
    setTickets(prev => [newTicket, ...prev]);
    // Optionally jump to ticket details or my tickets
  };

  const handleTicketUpdated = (updatedTicket: CareSyncTicket) => {
    setTickets(prev => prev.map(t => t.id === updatedTicket.id ? updatedTicket : t));
  };

  const handleSelectTicket = (ticketId: string) => {
    setSelectedTicketId(ticketId);
  };

  const selectedTicket = tickets.find(t => t.id === selectedTicketId || t.number === selectedTicketId || t.sysId === selectedTicketId);

  if (!user) {
    return <EnterpriseLogin onLoginSuccess={(u) => setUser(u)} />;
  }

  const openTicketsCount = tickets.filter(t => t.status === 'New' || t.status === 'Assigned' || t.status === 'In Progress').length;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans flex flex-col">
      
      {/* Main Header */}
      <Header
        user={user}
        onLogout={() => setUser(null)}
        onRaiseTicketClick={() => {
          setSelectedTicketId(null);
          setActiveTab('raise-ticket');
        }}
        notifications={notifications}
        onSelectTicket={(id) => {
          setSelectedTicketId(id);
          setActiveTab('dashboard');
        }}
      />

      {/* Main Shell */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        
        {/* Navigation Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onTabChange={(tab) => {
            setSelectedTicketId(null);
            setActiveTab(tab);
          }}
          userRole={user.role}
          openTicketsCount={openTicketsCount}
        />

        {/* Content Area */}
        <main className="flex-1 p-6 overflow-y-auto">
          
          {selectedTicket ? (
            <TicketDetailsView
              ticket={selectedTicket}
              user={user}
              onBack={() => setSelectedTicketId(null)}
              onTicketUpdated={handleTicketUpdated}
            />
          ) : activeTab === 'dashboard' ? (
            <MainDashboard
              user={user}
              tickets={tickets}
              onRaiseTicketClick={() => setActiveTab('raise-ticket')}
              onSelectTicket={handleSelectTicket}
              onViewMyTicketsClick={() => setActiveTab('my-tickets')}
            />
          ) : activeTab === 'raise-ticket' ? (
            <RaiseTicketView
              user={user}
              onTicketCreated={handleTicketCreated}
              onCancel={() => setActiveTab('dashboard')}
            />
          ) : activeTab === 'my-tickets' ? (
            <MyTicketsView
              tickets={tickets}
              onSelectTicket={handleSelectTicket}
              onRaiseTicketClick={() => setActiveTab('raise-ticket')}
            />
          ) : activeTab === 'it-support' ? (
            <ITSupportDashboard
              user={user}
              tickets={tickets}
              onSelectTicket={handleSelectTicket}
              onTicketUpdated={handleTicketUpdated}
            />
          ) : activeTab === 'admin-dashboard' ? (
            <AdminDashboard
              tickets={tickets}
              onSelectTicket={handleSelectTicket}
            />
          ) : activeTab === 'notifications' ? (
            <NotificationsView
              notifications={notifications}
              onSelectTicket={(id) => {
                setSelectedTicketId(id);
              }}
            />
          ) : (
            <MainDashboard
              user={user}
              tickets={tickets}
              onRaiseTicketClick={() => setActiveTab('raise-ticket')}
              onSelectTicket={handleSelectTicket}
              onViewMyTicketsClick={() => setActiveTab('my-tickets')}
            />
          )}

        </main>

      </div>
    </div>
  );
}

export default App;