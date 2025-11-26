'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { Report } from '@/types';
import CreateReport from './reports/CreateReport';
import ReportsList from './reports/ReportsList';
import CommunityReportsList from './reports/CommunityReportsList';
import AgencyDashboard from './reports/AgencyDashboard';
import AuthModal from '@/components/auth/AuthModal';
import { useToast } from '@/lib/toast-context';
import { handleError, logError } from '@/lib/error-handler';
import { AlertCircle, FileText, Plus, List, Award } from 'lucide-react';

export default function ReportsApp() {
  const { user, profile } = useAuth();
  const [view, setView] = useState<'create' | 'my' | 'all' | 'community' | 'agency'>('all');
  const [reports, setReports] = useState<Report[]>([]);
  const [allReports, setAllReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    // Load reports even when not logged in (for public viewing)
    loadReports();
    if (user) {
      subscribeToReports();
    }
  }, [user]);

  const loadReports = async () => {
    console.log('loadReports: Starting, user:', user?.id || 'not logged in', 'role:', profile?.role || 'none');
    setLoading(true);
    
    // List of known demo report titles (used in multiple places)
    const demoReportTitles = [
      'Large pothole on MG Road near Hazratganj crossing',
      'Streetlights not working on Vikramaditya Marg',
      'Garbage not being collected in Aminabad market area',
      'Dead dog on main road in Indira Nagar Sector 14',
      'Multiple potholes on Kanpur Road near Alambagh bus stand',
      'Flickering streetlight near Hazratganj metro station',
      'Garbage dump near residential complex in Gomti Nagar',
      'Dead cow on Lucknow-Kanpur highway',
      'Pothole on Rana Pratap Marg - RESOLVED',
      'Broken divider on Shaheed Path causing accidents'
    ];
    
    // Demo user names to use for demo reports
    const demoUserNames = [
      { full_name: 'Rahul Sharma', email: 'rahul.sharma@demo.urbanos.in' },
      { full_name: 'Priya Patel', email: 'priya.patel@demo.urbanos.in' },
      { full_name: 'Amit Kumar', email: 'amit.kumar@demo.urbanos.in' },
      { full_name: 'Kavita Singh', email: 'kavita.singh@demo.urbanos.in' },
      { full_name: 'Vijay Verma', email: 'vijay.verma@demo.urbanos.in' },
      { full_name: 'Neha Gupta', email: 'neha.gupta@demo.urbanos.in' },
      { full_name: 'Rohan Mishra', email: 'rohan.mishra@demo.urbanos.in' },
      { full_name: 'Anita Tiwari', email: 'anita.tiwari@demo.urbanos.in' },
      { full_name: 'Sanjay Yadav', email: 'sanjay.yadav@demo.urbanos.in' },
      { full_name: 'Meera Shah', email: 'meera.shah@demo.urbanos.in' }
    ];
    
    try {
      // Load user's own reports - only if logged in
      let myReports = null;
      if (user) {
        console.log('loadReports: Loading my reports for user:', user.id);
        const { data: myReportsData, error: myError } = await supabase
          .from('reports')
          .select(`
            *,
            users!user_id (
              id,
              full_name,
              email
            )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (myError) {
          console.error('Error loading my reports:', myError);
          // Don't throw, just continue without my reports
        } else {
          myReports = myReportsData;
        }
        
        console.log('loadReports: My reports loaded:', myReports?.length || 0);
        if (myReports && myReports.length > 0) {
          console.log('loadReports: Sample my report:', myReports[0]);
        }
        
        // Ensure videos and images arrays exist for each report
        // Also ensure we only include reports that actually belong to this user
        // AND exclude known demo reports (they should be owned by demo users)
        const normalizedMyReports = (myReports || [])
          .filter((report: any) => {
            // Must belong to this user
            if (report.user_id !== user.id) return false;
            // Exclude known demo reports (they should be owned by demo users, not the logged-in user)
            if (demoReportTitles.includes(report.title)) return false;
            return true;
          })
          .map((report: any) => ({
            ...report,
            videos: Array.isArray(report.videos) ? report.videos : [],
            images: Array.isArray(report.images) ? report.images : [],
            creator: Array.isArray(report.users) ? report.users[0] : (report.users || null),
          }));
        setReports(normalizedMyReports);
      } else {
        // No user, set empty array for my reports
        setReports([]);
      }

      // Load all reports (for "All Reports" view)
      // Public users can see non-anonymous reports, logged-in users see more
      console.log('loadReports: Loading all reports...');
      let query = supabase
        .from('reports')
        .select('*');

      // Don't filter by is_anonymous - we want to show all reports including demo ones
      // Demo reports will show fake creator names anyway
      if (!user) {
        // Public (not logged in): only show non-anonymous reports
        console.log('loadReports: Loading all reports (public - non-anonymous only)');
        query = query.eq('is_anonymous', false);
      } else if (profile?.role === 'citizen') {
        // Citizens can see all reports (demo reports will show fake names)
        console.log('loadReports: Loading all reports (citizen)');
      } else if (profile?.role === 'agency') {
        // Agencies see all reports or assigned reports
        console.log('loadReports: Loading all reports (agency)');
      } else {
        console.log('loadReports: Loading all reports (other role)');
      }

      const { data: allReportsData, error: allError } = await query.order('created_at', {
        ascending: false,
      });

      if (allError) {
        console.error('Error loading all reports:', {
          error: allError,
          code: allError.code,
          message: allError.message,
          details: allError.details,
          hint: allError.hint,
        });
        throw allError;
      }
      
      console.log('loadReports: All reports loaded:', allReportsData?.length || 0);
      
      // Fetch creator info separately for each report (more reliable than join)
      const reportsWithCreators = await Promise.all(
        (allReportsData || []).map(async (report: any, index: number) => {
          // Check if this is a demo report
          const isDemoReport = demoReportTitles.includes(report.title);
          
          // Fetch creator info separately
          let creator = null;
          try {
            // Only try to fetch creator if we have a user_id and user is logged in
            // For public users, RLS might block access to users table
            if (report.user_id && user) {
              const { data: userData, error: userError } = await supabase
                .from('users')
                .select('id, full_name, email')
                .eq('id', report.user_id)
                .single();
              
              if (!userError && userData) {
                // If this is a demo report, always use a fake demo creator name
                if (isDemoReport) {
                  // Use a consistent demo user based on the report index
                  const demoUser = demoUserNames[index % demoUserNames.length];
                  creator = {
                    id: report.user_id, // Keep the same ID for RLS purposes
                    full_name: demoUser.full_name,
                    email: demoUser.email
                  };
                  // Also ensure demo reports are not marked as anonymous for display
                  report.is_anonymous = false;
                } else {
                  creator = userData;
                }
              } else if (userError) {
                // Silently handle error - don't log as error since it's expected for public users
                // If it's a demo report and we can't fetch creator, still show demo name
                if (isDemoReport) {
                  const demoUser = demoUserNames[index % demoUserNames.length];
                  creator = {
                    id: report.user_id,
                    full_name: demoUser.full_name,
                    email: demoUser.email
                  };
                  report.is_anonymous = false;
                }
              }
            } else if (isDemoReport) {
              // For demo reports, always show a demo name even if not logged in
              const demoUser = demoUserNames[index % demoUserNames.length];
              creator = {
                id: report.user_id || 'demo-user',
                full_name: demoUser.full_name,
                email: demoUser.email
              };
              report.is_anonymous = false;
            } else if (!report.is_anonymous && report.user_id) {
              // For non-anonymous reports when not logged in, show generic creator
              creator = {
                id: report.user_id,
                full_name: 'User',
                email: null
              };
            }
          } catch (err) {
            // Silently handle exception - expected for public users
            if (isDemoReport) {
              const demoUser = demoUserNames[index % demoUserNames.length];
              creator = {
                id: report.user_id || 'demo-user',
                full_name: demoUser.full_name,
                email: demoUser.email
              };
              report.is_anonymous = false;
            }
          }
          
          return {
            ...report,
            videos: Array.isArray(report.videos) ? report.videos : [],
            images: Array.isArray(report.images) ? report.images : [],
            creator: creator,
          };
        })
      );
      
      setAllReports(reportsWithCreators);
      
      if (reportsWithCreators && reportsWithCreators.length > 0) {
        console.log('loadReports: Sample all report:', reportsWithCreators[0]);
      }
      
      console.log('loadReports: Successfully loaded reports');
    } catch (error) {
      console.error('Error in loadReports:', error);
      logError(error, 'ReportsApp.loadReports');
      const errorInfo = handleError(error);
      showToast(errorInfo.message, 'error');
      // Set empty arrays on error to prevent infinite loading
      setReports([]);
      setAllReports([]);
    } finally {
      setLoading(false);
      console.log('loadReports: Finished');
    }
  };

  const subscribeToReports = () => {
    const channel = supabase
      .channel('reports_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reports',
        },
        () => {
          loadReports();
        }
      )
      .subscribe();

    // Subscribe to community_reports changes
    const communityChannel = supabase
      .channel('community_reports_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'community_reports',
        },
        () => {
          loadReports();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(communityChannel);
    };
  };

  // Show sign-in prompt only for create/my reports views, but allow viewing all reports publicly
  const showSignInPrompt = !user && (view === 'create' || view === 'my');

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b border-foreground/10 px-6 py-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h3 className="text-xl font-bold">Reports</h3>
            <p className="text-sm text-foreground/70">
              {profile?.role === 'agency'
                ? 'Manage and respond to citizen reports'
                : 'Report issues, vote, and track community reports'}
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-2 mt-4 flex-wrap">
          {/* Create button - requires login */}
          {user ? (
            <button
              onClick={() => setView('create')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                view === 'create'
                  ? 'bg-windows-blue text-white'
                  : 'bg-foreground/10 hover:bg-foreground/20'
              }`}
            >
              <Plus className="w-4 h-4" />
              Create Report
            </button>
          ) : (
            <button
              onClick={() => setShowAuthModal(true)}
              className="px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 bg-foreground/10 hover:bg-foreground/20"
            >
              <Plus className="w-4 h-4" />
              Create Report (Sign In)
            </button>
          )}
          {/* My Reports button - requires login */}
          {user ? (
            <button
              onClick={() => setView('my')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                view === 'my'
                  ? 'bg-windows-blue text-white'
                  : 'bg-foreground/10 hover:bg-foreground/20'
              }`}
            >
              <FileText className="w-4 h-4" />
              My Reports
            </button>
          ) : (
            <button
              onClick={() => setShowAuthModal(true)}
              className="px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 bg-foreground/10 hover:bg-foreground/20"
            >
              <FileText className="w-4 h-4" />
              My Reports (Sign In)
            </button>
          )}
          <button
            onClick={() => setView('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              view === 'all'
                ? 'bg-windows-blue text-white'
                : 'bg-foreground/10 hover:bg-foreground/20'
            }`}
          >
            <List className="w-4 h-4" />
            All Reports
          </button>
          <button
            onClick={() => setView('community')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              view === 'community'
                ? 'bg-windows-blue text-white'
                : 'bg-foreground/10 hover:bg-foreground/20'
            }`}
          >
            <Award className="w-4 h-4" />
            Community Reports
          </button>
          {profile?.role === 'agency' && (
            <button
              onClick={() => setView('agency')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                view === 'agency'
                  ? 'bg-windows-blue text-white'
                  : 'bg-foreground/10 hover:bg-foreground/20'
              }`}
            >
              Dashboard
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin w-8 h-8 border-4 border-windows-blue border-t-transparent rounded-full"></div>
          </div>
        ) : showSignInPrompt ? (
          <div className="p-6 flex items-center justify-center min-h-[400px]">
            <div className="text-center max-w-md">
              <h3 className="text-2xl font-bold mb-4">Sign In Required</h3>
              <p className="text-foreground/70 mb-6">
                Please sign in to {view === 'create' ? 'create reports' : 'view your reports'}.
              </p>
              <button
                onClick={() => setShowAuthModal(true)}
                className="px-8 py-3 bg-windows-blue text-white rounded-lg font-semibold hover:bg-windows-blue-hover transition-colors"
              >
                Sign In
              </button>
            </div>
          </div>
        ) : view === 'create' ? (
          <CreateReport onSuccess={() => setView('my')} />
        ) : view === 'my' ? (
          <ReportsList 
            reports={reports.filter(r => r.user_id === user?.id)} 
            showFilter="my" 
          />
        ) : view === 'all' ? (
          <ReportsList reports={allReports} showFilter="all" />
        ) : view === 'community' ? (
          <CommunityReportsList />
        ) : view === 'agency' && profile?.role === 'agency' ? (
          <AgencyDashboard reports={allReports} />
        ) : (
          <ReportsList reports={allReports} showFilter="all" />
        )}
      </div>
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  );
}
