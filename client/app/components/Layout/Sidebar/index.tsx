import {
  ChevronsRight,
  ChevronsLeft,
  PlusCircle,
  SquarePen,
} from 'lucide-react';
import { NavLink, useLocation } from '@remix-run/react';
import { useState, useEffect } from 'react';
import { items, ItemType } from './SidebarItems';
import { useNavigate } from '@remix-run/react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '~/store/store';
import { Loader, LoaderPinwheel } from 'lucide-react';
import { fetchProjects } from '~/store/slices/sideBar';
import { setProject, setActiveProject } from '~/store/slices/sideBar';
import { getUniqueID } from '~/lib/utils';
//import { categoryRoutes : cat } from '~/constant';

type CategoryRoutes = {
  [key: string]: string;
};

const categoryRoutes: CategoryRoutes = {
  Reports: '/',
  'Company House': '/company-house',
};

type SidebarProps = {
  collapsed: boolean;
  setCollapsed: () => void;
};

export default function Sidebar({ collapsed, setCollapsed }: SidebarProps) {
  const [activeCategory, setActiveCategory] = useState<string>('');
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const location = useLocation();

  const { isCanvas, projects, activeProjectId, loading } = useSelector(
    (state: RootState) => state.sidebar
  );

  console.log('projects--------', projects);

  useEffect(() => {
    if (!projects.length) {
      dispatch(fetchProjects());
    }
    const currentPath: string = location.pathname;
    const matchedCategory: ItemType | undefined = items.find(
      (category) => category.url === currentPath
    );
    if (matchedCategory) {
      setActiveCategory(matchedCategory.id || '');
    }
  }, [location.pathname]);

  const handleCategoryClick = (item: ItemType): void => {
    setActiveCategory(item.id || '');
    if (item.id === 'reports') {
      const newID = getUniqueID();
      dispatch(setActiveProject({ id: '', name: '', temp_project_id: newID }));
    }
    navigate(item.url);
  };

  return (
    <div
      className={`h-[calc(100vh-48px)] sticky top-[48px] text-gray-600 bg-gray-50 border-r p-4 flex flex-col transition-all duration-300 ${collapsed ? 'w-16' : 'w-72'} ${isCanvas && 'hidden'}`}
    >
      <div
        className={`flex items-center justify-between mb-4 ${collapsed ? 'flex-col space-y-2' : ''}`}
      >
        {!collapsed && (
          <button
            onClick={() => {
              navigate('./');
              const newID = getUniqueID();
              dispatch(
                setActiveProject({ id: '', name: '', temp_project_id: newID })
              );
            }}
            className="p-1 rounded hover:bg-gray-200 text-sm font-medium space-x-2 items-center flex"
          >
            <SquarePen className="w-5 h-5" />
            <div className="font-semibold">{'Create New Report'}</div>
          </button>
        )}
        <button
          onClick={() => setCollapsed()}
          className="p-1 rounded hover:bg-gray-200"
        >
          {collapsed ? (
            <ChevronsRight className="w-5 h-5" />
          ) : (
            <ChevronsLeft className="w-5 h-5" />
          )}
        </button>
        {collapsed && (
          <button
            onClick={() => {
              navigate('./');
              const newID = getUniqueID();
              dispatch(
                setActiveProject({ id: '', name: '', temp_project_id: newID })
              );
            }}
            className="p-1 rounded hover:bg-gray-200 text-sm font-medium space-x-2 items-center flex"
          >
            <SquarePen className="w-5 h-5" />
          </button>
        )}
      </div>

      {!collapsed && (
        <nav className="h-screen space-y-6 font-medium mt-2 overflow-y-auto">
          <div className="space-y-2">
            <h6 className="font-semibold text-sm">Categories</h6>
            <div className="space-y-1">
              {items.map((item: ItemType) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleCategoryClick(item)}
                    className={`flex text-sm items-center space-x-2 p-2 w-full text-left hover:bg-gray-200 rounded ${activeCategory === item.label ? 'bg-gray-200' : ''}`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <h6 className="font-semibold text-sm">Histroy</h6>
            {loading ? (
              <span className="h-14 flex text-xs items-center justify-center space-x-2 p-2 min-w-10 hover:bg-gray-200 rounded">
                <Loader className="mt-8 w-4 h-4 text-gray-600 animate-spin" />
              </span>
            ) : (
              <div className="space-y-1">
                {projects.map((item) => (
                  <NavLink
                    key={item.id}
                    to={`/r/${item.id}`}
                    onClick={() => {
                      dispatch(setActiveProject(item));
                    }}
                    className={`flex text-xs items-center space-x-2 p-2 min-w-10 hover:bg-gray-200 rounded ${activeProjectId?.id === item.id ? 'bg-gray-200' : ''}`}
                  >
                    <div className="truncate w-[95%]">{item.name}</div>
                  </NavLink>
                ))}
              </div>
            )}
          </div>
        </nav>
      )}
    </div>
  );
}
