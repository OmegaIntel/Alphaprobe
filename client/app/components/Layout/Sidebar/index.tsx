import {
  ChevronsRight,
  ChevronsLeft,
  SquarePen,
  Loader
} from 'lucide-react';
import { NavLink, useLocation } from '@remix-run/react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { items, ItemType } from './SidebarItems';
import { useNavigate } from '@remix-run/react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '~/store/store';
import {
  fetchProjects,
  setActiveProject,
  initializeStates
} from '~/store/slices/sideBar';
import { getUniqueID } from '~/lib/utils';

type SidebarProps = {
  collapsed: boolean;
  setCollapsed: () => void;
};

export default function Sidebar({ collapsed, setCollapsed }: SidebarProps) {
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [activeWorkflowType, setActiveWorkflowType] = useState<string>('');
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(true);
  const [page, setPage] = useState<number>(0);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastProjectRef = useRef<HTMLAnchorElement | null>(null);

  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const location = useLocation();

  const { isCanvas, projects, activeProjectId, loading } = useSelector(
    (state: RootState) => state.sidebar
  );

  // Initialize redux state from localStorage
  useEffect(() => {
    dispatch(initializeStates());
  }, [dispatch]);

  // Load initial projects based on current path
  useEffect(() => {
    const currentPath = location.pathname;
    const matchedCategory = items.find(
      (category) => category.url === currentPath
    );
    if (matchedCategory) {
      setActiveCategory(matchedCategory.id || '');
      setActiveWorkflowType(matchedCategory.workflowType || '');

      if (projects.length === 0) {
        dispatch(fetchProjects({ limit: 10, offset: 0, workflowType: matchedCategory.workflowType }))
          .then((action) => {
            const payload = action.payload as any;
            if (action.type === fetchProjects.fulfilled.type && payload.pagination) {
              setHasMore(payload.pagination.has_more);
              setPage(1);
            }
          });
      }
    }
  }, [location.pathname, dispatch, projects.length]);

  // Intersection Observer for infinite scroll
  const lastProjectCallback = useCallback((node: HTMLAnchorElement | null) => {
    if (loading) return;

    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        const offset = page * 10;
        dispatch(fetchProjects({ limit: 10, offset, workflowType: activeWorkflowType }))
          .then((action) => {
            const payload = action.payload as any;
            if (action.type === fetchProjects.fulfilled.type && payload.pagination) {
              setHasMore(payload.pagination.has_more);
              setPage(prev => prev + 1);
            }
          });
      }
    });

    if (node) observerRef.current.observe(node);
    lastProjectRef.current = node;
  }, [loading, hasMore, page, activeWorkflowType, dispatch]);

  const handleCategoryClick = (item: ItemType): void => {
    setActiveCategory(item.id || '');
    setActiveWorkflowType(item.workflowType);
    const newID = getUniqueID();

    dispatch(setActiveProject({ id: '', name: '', temp_project_id: newID }));

    setPage(0);
    setHasMore(true);

    dispatch(fetchProjects({ limit: 10, offset: 0, workflowType: item.workflowType }))
      .then((action) => {
        const payload = action.payload as any;
        if (action.type === fetchProjects.fulfilled.type && payload.pagination) {
          setHasMore(payload.pagination.has_more);
          setPage(1);
        }
      });

    setIsHistoryOpen(true);
    navigate(item.url);
  };

  const toggleHistory = () => {
    setIsHistoryOpen(!isHistoryOpen);
  };

  return (
    <div
      className={`h-[calc(100vh-48px)] sticky top-[48px] text-gray-600 bg-gray-50 border-r p-4 flex flex-col transition-all duration-300 ${collapsed ? 'w-16' : 'w-72'} ${isCanvas && 'hidden'}`}
    >
      <div className={`flex items-center justify-between mb-4 ${collapsed ? 'flex-col space-y-2' : ''}`}>
        {!collapsed && (
          <button
            onClick={() => {
              navigate('./');
              const newID = getUniqueID();
              dispatch(setActiveProject({ id: '', name: '', temp_project_id: newID }));
            }}
            className="p-1 rounded hover:bg-gray-200 text-sm font-medium space-x-2 items-center flex"
          >
            <SquarePen className="w-5 h-5" />
            <div className="font-semibold">{'Create New Report'}</div>
          </button>
        )}
        <button
          onClick={setCollapsed}
          className="p-1 rounded hover:bg-gray-200"
        >
          {collapsed ? <ChevronsRight className="w-5 h-5" /> : <ChevronsLeft className="w-5 h-5" />}
        </button>
        {collapsed && (
          <button
            onClick={() => {
              navigate('./');
              const newID = getUniqueID();
              dispatch(setActiveProject({ id: '', name: '', temp_project_id: newID }));
            }}
            className="p-1 rounded hover:bg-gray-200 text-sm font-medium space-x-2 items-center flex"
          >
            <SquarePen className="w-5 h-5" />
          </button>
        )}
      </div>

      {!collapsed && (
        <nav className="h-screen space-y-2 font-medium mt-2 overflow-y-auto">
          <div className="space-y-2">
            <h6 className="font-semibold text-sm">Workflows</h6>
            <div className="space-y-1">
              {items.map((item) => {
                const Icon = item.icon;
                const isActive = activeCategory === item.id;

                return (
                  <div key={item.id} className="flex flex-col">
                    <button
                      onClick={() => handleCategoryClick(item)}
                      className={`flex text-sm items-center space-x-2 p-2 w-full text-left hover:bg-gray-200 rounded ${isActive ? 'bg-gray-200' : ''}`}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{item.label}</span>
                    </button>

                    {isActive && (
                      <div className="ml-4 mt-2">
                        <div
                          className={`ml-2 mt-1 space-y-1 overflow-hidden transition-all duration-300 ease-in-out ${
                            isHistoryOpen ? 'max-h-72 opacity-100' : 'max-h-0 opacity-0'
                          }`}
                        >
                          <div className="h-72 overflow-y-auto pr-1 space-y-1">
                            {loading && projects.length === 0 ? (
                              <span className="flex text-xs items-center justify-center space-x-2 p-2 min-w-10 rounded">
                                <Loader className="w-4 h-4 text-gray-600 animate-spin" />
                              </span>
                            ) : (
                              <div className="space-y-1">
                                {projects.map((project, index) => {
                                  const isLastItem = index === projects.length - 1;
                                  return (
                                    <NavLink
                                      key={project.id}
                                      ref={isLastItem ? lastProjectCallback : null}
                                      to={`/r/${project.id}`}
                                      onClick={() => dispatch(setActiveProject(project))}
                                      className={`flex text-xs items-center space-x-2 p-2 min-w-10 hover:bg-gray-200 rounded ${activeProjectId?.id === project.id ? 'bg-gray-200' : ''}`}
                                    >
                                      <div className="truncate w-[95%]">{project.name}</div>
                                    </NavLink>
                                  );
                                })}
                                {loading && projects.length > 0 && (
                                  <div className="flex justify-center py-2">
                                    <Loader className="w-4 h-4 text-gray-600 animate-spin" />
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ); 
              })}
            </div>
          </div>
        </nav>
      )}
    </div>
  );
}
