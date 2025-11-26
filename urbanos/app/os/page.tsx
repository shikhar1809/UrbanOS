'use client';

import AppWindow from '@/components/os/AppWindow';
import { FileText, Users, TrendingUp, ShieldCheck, UserCircle, Bell, Megaphone, Wind, Shield } from 'lucide-react';

// Placeholder app components (will be replaced with actual apps)
import ReportsApp from '@/components/apps/ReportsApp';
import CommunityApp from '@/components/apps/CommunityApp';
import PredictorApp from '@/components/apps/PredictorApp';
import SecurityApp from '@/components/apps/SecurityApp';
import ProfileApp from '@/components/apps/ProfileApp';
import NotificationsApp from '@/components/apps/NotificationsApp';
import AlertsApp from '@/components/apps/AlertsApp';
import PollutionApp from '@/components/apps/PollutionApp';
import AdminPanel from '@/components/apps/AdminPanel';

export default function OSPage() {
  return (
    <>
      {/* Reports App */}
      <AppWindow
        appId="reports"
        title="Report Issues"
        icon={<FileText className="w-5 h-5 text-red-500" />}
      >
        <ReportsApp />
      </AppWindow>

      {/* Community App */}
      <AppWindow
        appId="community"
        title="Know Your Community"
        icon={<Users className="w-5 h-5 text-blue-500" />}
      >
        <CommunityApp />
      </AppWindow>

      {/* Predictor App */}
      <AppWindow
        appId="predictor"
        title="Issue Predictor"
        icon={<TrendingUp className="w-5 h-5 text-green-500" />}
      >
        <PredictorApp />
      </AppWindow>

      {/* Security App */}
      <AppWindow
        appId="security"
        title="Cybersecurity Alerts"
        icon={<ShieldCheck className="w-5 h-5 text-purple-500" />}
      >
        <SecurityApp />
      </AppWindow>

      {/* Pollution App */}
      <AppWindow
        appId="pollution"
        title="Pollution Monitor"
        icon={<Wind className="w-5 h-5 text-cyan-500" />}
      >
        <PollutionApp />
      </AppWindow>

      {/* Admin Panel */}
      <AppWindow
        appId="admin"
        title="Admin Panel"
        icon={<Shield className="w-5 h-5 text-red-600" />}
      >
        <AdminPanel />
      </AppWindow>

      {/* Alerts App */}
      <AppWindow
        appId="alerts"
        title="Public Alerts"
        icon={<Megaphone className="w-5 h-5 text-orange-500" />}
      >
        <AlertsApp />
      </AppWindow>

      {/* Profile App */}
      <AppWindow
        appId="profile"
        title="Profile & Settings"
        icon={<UserCircle className="w-5 h-5 text-gray-500" />}
      >
        <ProfileApp />
      </AppWindow>

      {/* Notifications App */}
      <AppWindow
        appId="notifications"
        title="Notifications"
        icon={<Bell className="w-5 h-5 text-windows-blue" />}
      >
        <NotificationsApp />
      </AppWindow>
    </>
  );
}

