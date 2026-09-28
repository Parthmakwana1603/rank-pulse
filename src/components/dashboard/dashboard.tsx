import { useState, useEffect } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Sidebar } from './sidebar';
import { Topbar } from './topbar';
import { HeroSection } from './hero-section';
import { KpiCard } from './kpi-card';
import { QuickActions } from './quick-actions';
import { ChartsSection } from './charts-section';
import { KeywordSection } from './keyword-section';
import { SiteAuditSection } from './site-audit-section';
import { BacklinkSection } from './backlink-section';
import { CompetitorSection } from './competitor-section';
import { AiSeoSection } from './ai-seo-section';
import { CoreWebVitalsSection } from './core-web-vitals-section';
import { RecentActivitiesSection } from './recent-activities-section';
import { ProjectsScreen } from './pages/projects-screen';
import { KeywordRankingsScreen } from './pages/keyword-rankings-screen';
import { SiteAuditScreen } from './pages/site-audit-screen';
import { BacklinksScreen } from './pages/backlinks-screen';
import { CompetitorsScreen } from './pages/competitors-screen';
import { ContentScreen } from './pages/content-screen';
import { AiSeoScreen } from './pages/ai-seo-screen';
import { ReportsScreen } from './pages/reports-screen';
import { SettingsScreen } from './pages/settings-screen';
import { SchemaGeneratorScreen } from './pages/schema-generator-screen';
import { kpis } from '@/lib/seo-data';
import { cn } from '@/lib/utils';
import { pageForPath, pathForPage } from '@/lib/routes';

export function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const activePage = pageForPath(location.pathname);

  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = activePage && activePage !== 'Dashboard'
      ? `${activePage} · RankPulse`
      : 'RankPulse · SEO Performance Dashboard';
  }, [activePage]);

  const handleNavigate = (label: string) => {
    navigate(pathForPage(label));
    setMobileNavOpen(false);
  };

  if (!activePage) return <Navigate to="/" replace />;

  const renderPage = () => {
    switch (activePage) {
      case 'Dashboard':
        return (
          <div className="mx-auto max-w-[1600px] space-y-6">
            <HeroSection />
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {kpis.map((kpi, i) => (
                <KpiCard key={kpi.id} kpi={kpi} index={i} />
              ))}
            </div>
            <QuickActions />
            <ChartsSection />
            <KeywordSection />
            <SiteAuditSection />
            <BacklinkSection />
            <CompetitorSection />
            <AiSeoSection />
            <CoreWebVitalsSection />
            <RecentActivitiesSection />
            <footer className="flex items-center justify-between border-t pt-5 text-xs text-muted-foreground">
              <p>RankPulse SEO Suite · Demo data for illustration</p>
              <p>Powered by RankPulse Analytics</p>
            </footer>
          </div>
        );
      case 'Projects':
        return <ProjectsScreen />;
      case 'Keyword Rankings':
        return <KeywordRankingsScreen />;
      case 'Site Audit':
        return <SiteAuditScreen />;
      case 'Backlinks':
        return <BacklinksScreen />;
      case 'Competitors':
        return <CompetitorsScreen />;
      case 'Content':
        return <ContentScreen />;
      case 'AI SEO':
        return <AiSeoScreen />;
      case 'Reports':
        return <ReportsScreen />;
      case 'Settings':
        return <SettingsScreen />;
      case 'Schema Generator':
        return <SchemaGeneratorScreen />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar
        open={sidebarOpen}
        onToggle={() => setSidebarOpen((v) => !v)}
        mobileOpen={mobileNavOpen}
        onMobileClose={() => setMobileNavOpen(false)}
        active={activePage}
        onNavigate={handleNavigate}
      />
      <div
        className={cn(
          'flex min-h-screen flex-col transition-all duration-300',
          sidebarOpen ? 'lg:pl-64' : 'lg:pl-[76px]'
        )}
      >
        <Topbar onNavigate={handleNavigate} onMenuClick={() => setMobileNavOpen(true)} />
        <main className="min-w-0 flex-1 p-4 md:p-6">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}
