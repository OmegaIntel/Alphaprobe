import { ReactNode, useState } from 'react';
import Sidebar from './components/Layout/Sidebar';
import Header from './components/Layout/Header';
import { Provider } from 'react-redux';
import store from './store/store';

type LayoutProps = {
  children: ReactNode;
};

export default function Layout({ children }: LayoutProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);

  return (
    <Provider store={store}>
      <div className="h-screen">
      <Header />
        <div className="flex-1 flex flex-row">
          <Sidebar collapsed={isSidebarCollapsed} setCollapsed={() => setIsSidebarCollapsed(!isSidebarCollapsed)} />
          <main className="flex-1 p-4">{children}</main>
        </div>
      </div>
    </Provider>
  );
}
