import { ReactNode, useState } from 'react';
import { Provider } from 'react-redux';
import store from './store/store';

import Sidebar from './components/Layout/Sidebar';
import Header from './components/Layout/Header';

type LayoutProps = { children: ReactNode };

export default function Layout({ children }: LayoutProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);

  return (
    <Provider store={store}>
      {/* 1) full‐height flex-column */}
      <div className="h-screen flex flex-col">
        {/* header stays at top */}
        <Header />

        {/* 2) below header: sidebar + main */}
        <div className="flex flex-1 overflow-hidden">
          {/* 3) fixed-width, non-scrolling sidebar */}
          <div className="w-64 flex-shrink-0">
            <Sidebar
              collapsed={isSidebarCollapsed}
              setCollapsed={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            />
          </div>

          {/* 4) scrollable main content */}
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </Provider>
  );
}
