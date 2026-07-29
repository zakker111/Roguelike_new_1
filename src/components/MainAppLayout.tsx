import React from 'react';

export interface MainAppLayoutProps {
  header?: React.ReactNode;
  children: React.ReactNode;
  overlays?: React.ReactNode;
  className?: string;
}

/**
 * MainAppLayout deculates top-level HUD elements, header navigation, status bars,
 * game canvas viewports, and modal overlays into a clean app shell layout.
 */
export const MainAppLayout: React.FC<MainAppLayoutProps> = ({
  header,
  children,
  overlays,
  className = '',
}) => {
  return (
    <div
      id="main-app-layout"
      className={`min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none antialiased ${className}`}
    >
      {header}

      <main id="main-app-viewport" className="flex-1 flex flex-col min-h-0 relative">
        {children}
      </main>

      {overlays}
    </div>
  );
};

export default MainAppLayout;
