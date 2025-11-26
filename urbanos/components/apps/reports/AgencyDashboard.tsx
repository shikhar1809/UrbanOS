'use client';

import { Report } from '@/types';
import { supabase } from '@/lib/supabase';
import { useState } from 'react';
import { TrendingUp, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { logError } from '@/lib/error-handler';

interface AgencyDashboardProps {
  reports: Report[];
}

export default function AgencyDashboard({ reports }: AgencyDashboardProps) {
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [updating, setUpdating] = useState(false);

  const stats = {
    total: reports.length,
    pending: reports.filter((r) => ['submitted', 'received'].includes(r.status)).length,
    inProgress: reports.filter((r) => r.status === 'in-progress').length,
    resolved: reports.filter((r) => r.status === 'resolved').length,
    avgResponseTime:
      reports.filter((r) => r.response_time_hours).reduce((acc, r) => acc + (r.response_time_hours || 0), 0) /
        reports.filter((r) => r.response_time_hours).length || 0,
  };

  const updateReportStatus = async (reportId: string, status: Report['status']) => {
    setUpdating(true);
    try {
      const { error } = await supabase
        .from('reports')
        .update({ status })
        .eq('id', reportId);

      if (error) throw error;
    } catch (error) {
      logError(error, 'AgencyDashboard.updateReportStatus');
      // Error handling can be added here if needed
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-foreground/5 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-blue-500" />
              <span className="text-sm text-foreground/70">Total</span>
            </div>
            <div className="text-2xl font-bold">{stats.total}</div>
          </div>
          <div className="bg-yellow-500/10 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-yellow-500" />
              <span className="text-sm text-foreground/70">Pending</span>
            </div>
            <div className="text-2xl font-bold">{stats.pending}</div>
          </div>
          <div className="bg-purple-500/10 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-purple-500" />
              <span className="text-sm text-foreground/70">In Progress</span>
            </div>
            <div className="text-2xl font-bold">{stats.inProgress}</div>
          </div>
          <div className="bg-green-500/10 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-sm text-foreground/70">Resolved</span>
            </div>
            <div className="text-2xl font-bold">{stats.resolved}</div>
          </div>
          <div className="bg-foreground/5 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-foreground/50" />
              <span className="text-sm text-foreground/70">Avg Time</span>
            </div>
            <div className="text-2xl font-bold">
              {Math.round(stats.avgResponseTime)}h
            </div>
          </div>
        </div>

        {/* Reports Table */}
        <div className="bg-foreground/5 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-foreground/10">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold">Title</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Type</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Submitted</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-foreground/10">
              {reports.map((report) => (
                <tr key={report.id} className="hover:bg-foreground/5">
                  <td className="px-4 py-3 text-sm">{report.title}</td>
                  <td className="px-4 py-3 text-sm capitalize">{report.type}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className="px-2 py-1 rounded-full text-xs bg-foreground/10 capitalize">
                      {report.status.replace('-', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {new Date(report.submitted_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <select
                      value={report.status}
                      onChange={(e) => updateReportStatus(report.id, e.target.value as Report['status'])}
                      disabled={updating}
                      className="px-3 py-1 rounded-lg bg-foreground/10 border border-foreground/20 text-sm disabled:opacity-50"
                    >
                      <option value="submitted">Submitted</option>
                      <option value="received">Received</option>
                      <option value="in-progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

