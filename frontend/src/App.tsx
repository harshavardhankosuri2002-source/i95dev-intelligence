import React, { useState, useEffect } from 'react';
import { Sidebar, NavTab } from './components/Sidebar';
import { TopNav } from './components/TopNav';
import { Customer360Modal } from './components/Customer360Modal';

// Modules
import { ExecutiveOverview } from './modules/ExecutiveOverview';
import { CustomerIntelligence } from './modules/CustomerIntelligence';
import { BehavioralSegments } from './modules/BehavioralSegments';
import { AIRecommendations } from './modules/AIRecommendations';
import { FollowUpAutomation } from './modules/FollowUpAutomation';
import { MessageCentre } from './modules/MessageCentre';
import { CampaignAnalytics } from './modules/CampaignAnalytics';
import { AIAnalyst } from './modules/AIAnalyst';
import { BusinessImpact } from './modules/BusinessImpact';
import { DataManagement } from './modules/DataManagement';

import { api } from './services/api';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>('overview');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  
  // Quick jump parameters for Message Centre
  const [messageTargetCustomer, setMessageTargetCustomer] = useState<string | null>(null);
  const [messageTargetTrigger, setMessageTargetTrigger] = useState<string | null>(null);

  // Global filters
  const [selectedAM, setSelectedAM] = useState<string>('All Account Managers');
  const [pendingTasksCount, setPendingTasksCount] = useState<number>(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchTaskCount = () => {
    api.getTasks('PENDING')
      .then(res => setPendingTasksCount(res.length))
      .catch(console.error);
  };

  useEffect(() => {
    fetchTaskCount();
    const interval = setInterval(fetchTaskCount, 15000); // 15s poll for pending tasks
    return () => clearInterval(interval);
  }, []);

  const handleRefreshData = () => {
    setIsRefreshing(true);
    fetchTaskCount();
    setTimeout(() => setIsRefreshing(false), 800);
  };

  const handleOpenMessageCentre = (customerId: string, triggerName: string) => {
    setMessageTargetCustomer(customerId);
    setMessageTargetTrigger(triggerName);
    setActiveTab('messages');
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden text-slate-900 font-sans">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        pendingTasksCount={pendingTasksCount}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navigation */}
        <TopNav
          onRefreshData={handleRefreshData}
          isRefreshing={isRefreshing}
          selectedAM={selectedAM}
          onSelectAM={setSelectedAM}
        />

        {/* Scrollable View Container */}
        <main className="flex-1 overflow-y-auto">
          {activeTab === 'overview' && (
            <ExecutiveOverview
              onSelectCustomer={setSelectedCustomerId}
              selectedAM={selectedAM}
            />
          )}

          {activeTab === 'customers' && (
            <CustomerIntelligence
              onSelectCustomer={setSelectedCustomerId}
              onOpenMessageCentre={handleOpenMessageCentre}
              selectedAM={selectedAM}
            />
          )}

          {activeTab === 'segments' && <BehavioralSegments />}

          {activeTab === 'recommendations' && (
            <AIRecommendations onOpenMessageCentre={handleOpenMessageCentre} />
          )}

          {activeTab === 'automation' && <FollowUpAutomation />}

          {activeTab === 'messages' && (
            <MessageCentre
              initialCustomerId={messageTargetCustomer}
              initialTrigger={messageTargetTrigger}
            />
          )}

          {activeTab === 'analytics' && <CampaignAnalytics />}

          {activeTab === 'analyst' && <AIAnalyst />}

          {activeTab === 'impact' && <BusinessImpact />}

          {activeTab === 'data' && <DataManagement />}
        </main>
      </div>

      {/* Customer 360-Degree Modal Drawer */}
      <Customer360Modal
        customerId={selectedCustomerId}
        onClose={() => setSelectedCustomerId(null)}
        onOpenMessageCentre={handleOpenMessageCentre}
      />
    </div>
  );
};

export default App;
