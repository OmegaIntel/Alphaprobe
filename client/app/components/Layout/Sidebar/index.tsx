import {
  ChevronsRight,
  ChevronsLeft,
  PlusCircle,
  FileText,
  BarChart,
  PieChart,
} from 'lucide-react';
import { NavLink, useLocation } from '@remix-run/react';
import { useState, useEffect } from 'react';
import { items, ItemType } from './SidebarItems';
import { useNavigate } from '@remix-run/react';
import { useSelector } from 'react-redux';
import { RootState } from '~/store/store';
import { ChatSession } from '~/components/Dashboard/MarketResearch/ChatSessions';
//import { categoryRoutes : cat } from '~/constant';

type CategoryRoutes = {
  [key: string]: string;
};

const categoryRoutes: CategoryRoutes = {
  'Home': '/',
  'Market Research': '/market-research',
  'Company House' : '/company-house'
};

type SidebarProps = {
  collapsed: boolean;
  setCollapsed: () => void;
};

export default function Sidebar({ collapsed, setCollapsed }: SidebarProps) {
  const [activeMenu, setActiveMenu] = useState<string>('new');
  const [activeCategory, setActiveCategory] = useState<string>('');
  const navigate = useNavigate();
  const location = useLocation();
  const { isCanvas, projects, activeProjectId } = useSelector(
    (state: RootState) => state.sidebar
  );

  const isMarketResearch: boolean = location.pathname.includes('market-research');

  const marketResearchItems: { id: string; label: string; icon: JSX.Element }[] = [
    { id: 'industry-analysis', label: 'Industry Analysis', icon: <BarChart className="w-4 h-4" /> },
    { id: 'competitor-analysis', label: 'Competitor Analysis', icon: <PieChart className="w-4 h-4" /> },
    { id: 'market-trends', label: 'Market Trends', icon: <FileText className="w-4 h-4" /> },
    { id: 'reports', label: 'Research Reports', icon: <FileText className="w-4 h-4" /> },
  ];

  useEffect(() => {
    const currentPath: string = location.pathname;
    const matchedCategory: string | undefined = Object.keys(categoryRoutes).find(
      (category) => categoryRoutes[category] === currentPath
    );
    if (matchedCategory) {
      setActiveCategory(matchedCategory);
    }
  }, [location.pathname]);

  const handleCategoryClick = (category: string): void => {
    setActiveCategory(category);
    navigate(categoryRoutes[category]);
  };

  const handleSubcategoryClick = (id: string): void => {
    navigate(`/market-research/${id}`);
  };

  return (
    <div className={`h-screen text-gray-600 shadow-lg p-4 flex flex-col transition-all duration-300 ${collapsed ? 'w-16' : 'w-72'} ${isCanvas && 'hidden'}`}> 
      <div className={`flex items-center justify-between mb-4 ${collapsed ? 'flex-col space-y-2' : ''}`}> 
        {!collapsed && (
          <button onClick={() => navigate('./')} className="p-1 rounded hover:bg-gray-200 text-sm font-medium space-x-2 items-center flex">
            <PlusCircle className="w-5 h-5" />
            <div className="font-semibold">{'Create New Document'}</div>
          </button>
        )}
        <button onClick={() => setCollapsed()} className="p-1 rounded hover:bg-gray-200">
          {collapsed ? <ChevronsRight className="w-5 h-5" /> : <ChevronsLeft className="w-5 h-5" />}
        </button>
      </div>

      {!collapsed && (
        <nav className="h-screen space-y-6 font-medium mt-2 overflow-y-auto">
          <div className="space-y-2">
            <h6 className="font-semibold text-sm">Categories</h6>
            <div className="space-y-1">
              {Object.keys(categoryRoutes).map((category) => (
                <button key={category} onClick={() => handleCategoryClick(category)} className={`flex text-sm items-center space-x-2 p-2 w-full text-left hover:bg-gray-200 rounded ${activeCategory === category ? 'bg-gray-200' : ''}`}>
                  <span>{category}</span>
                </button>
              ))}
            </div>
          </div>

          {isMarketResearch && (
            <div className="space-y-2">
              <ChatSession />
            </div>
          )}

          {!isMarketResearch && (
            <div className="space-y-2">
              <h6 className="font-semibold text-sm">Your Projects</h6>
              <div className="space-y-1">
                {items.map((item) => (
                  <NavLink key={item.id} to={`/${item.id}`} onClick={() => setActiveMenu(item.id as string)} className={`flex text-sm items-center space-x-2 p-2 min-w-10 hover:bg-gray-200 rounded ${activeMenu === item.id ? 'bg-gray-200' : ''}`}>
                    <div>{item.label}</div>
                  </NavLink>
                ))}
              </div>
            </div>
          )}
        </nav>
      )}
    </div>
  );
}
