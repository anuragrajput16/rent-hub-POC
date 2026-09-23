import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { TopBar } from './TopBar';
import { Sidebar } from './Sidebar';

export function AppShell() {
  const [drawer, setDrawer] = useState(false);
  const { pathname } = useLocation();

  // Close the mobile drawer whenever the route changes.
  useEffect(() => setDrawer(false), [pathname]);

  return (
    <>
      <TopBar onMenu={() => setDrawer(true)} />

      <div className="grid min-h-[calc(100vh-65px)] lg:grid-cols-[236px_1fr]">
        <div className="hidden lg:block">
          <Sidebar />
        </div>

        {drawer && (
          <div
            className="fixed inset-0 z-40 bg-green-deep/45 lg:hidden"
            onClick={() => setDrawer(false)}
            role="presentation"
          >
            <div
              className="h-full w-[266px] max-w-[80vw] overflow-y-auto bg-[#F0F4EE]"
              onClick={(e) => e.stopPropagation()}
            >
              <Sidebar onNavigate={() => setDrawer(false)} />
            </div>
          </div>
        )}

        <main className="w-full max-w-[1180px] px-[18px] pt-6 pb-14 sm:px-[34px] sm:pt-[30px]">
          <div key={pathname} className="rise">
            <Outlet />
          </div>
        </main>
      </div>
    </>
  );
}
