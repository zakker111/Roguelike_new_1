import React from 'react';

export interface MainAppLayoutProps {
  header?: React.ReactNode;
  hudStatusBar?: React.ReactNode;
  tabBar?: React.ReactNode;
  children: React.ReactNode;
  sideViewport?: React.ReactNode;
  bottomLogViewport?: React.ReactNode;
  overlays?: React.ReactNode;
  className?: string;
}

/**
 * MainAppLayout encapsulates top-level HUD elements, header navigation, status bars,
 * game canvas viewports, side viewports, combat logs, and active overlays into a clean app shell layout.
 */
export const MainAppLayout: React.FC<MainAppLayoutProps> = ({
  header,
  hudStatusBar,
  tabBar,
  children,
  sideViewport,
  bottomLogViewport,
  overlays,
  className = '',
}) => {
  return (
    <div
      id="main-app-layout"
      className={`min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none antialiased ${className}`}
    >
      {header && <header id="main-app-header">{header}</header>}

      {hudStatusBar && <section id="main-app-hud-status">{hudStatusBar}</section>}

      {tabBar && <nav id="main-app-tab-bar" aria-label="Main Navigation">{tabBar}</nav>}

      <main id="main-app-viewport" className="flex-1 flex flex-col min-h-0 relative">
        {sideViewport ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-0">
            <div className="lg:col-span-8 flex flex-col min-h-0 relative">
              {children}
            </div>
            <div className="lg:col-span-4 flex flex-col min-h-0">
              {sideViewport}
            </div>
          </div>
        ) : (
          children
        )}
      </main>

      {bottomLogViewport && <section id="main-app-log-viewport">{bottomLogViewport}</section>}

      {overlays && <div id="main-app-overlays">{overlays}</div>}
    </div>
  );
};

export default MainAppLayout;
