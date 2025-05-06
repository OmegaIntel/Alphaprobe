import {
  ChevronsRight,
  ChevronsLeft,
  SquarePen,
  ChevronDown,
  ChevronRight,
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
  setProject, 
  setActiveProject, 
  initializeStates 
} from '~/store/slices/sideBar';
import { getUniqueID } from '~/lib/utils';

type CategoryRoutes = {
  [key: string]: string;
};

type SidebarProps = {
  collapsed: boolean;
  setCollapsed: () => void;
};

export default function Sidebar({ collapsed, setCollapsed }: SidebarProps) {
  const [activeCategory, setActiveCategory] = useState<string>('');
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

  // Load initial projects
  useEffect(() => {
    const currentPath: string = location.pathname;
    const matchedCategory: ItemType | undefined = items.find(
      (category) => category.url === currentPath
    );
    if (matchedCategory) {
      setActiveCategory(matchedCategory.id || '');
      
      // Only fetch projects when due-diligence is the active category
      if (matchedCategory.id === 'due-diligence' && projects.length === 0) {
        dispatch(fetchProjects({ limit: 10, offset: 0 }))
          .then((action) => {
            // Safely access pagination data
            const payload = action.payload as any;
            if (action.type === fetchProjects.fulfilled.type && payload.pagination) {
              setHasMore(payload.pagination.has_more);
              setPage(1); // Initial page loaded
            }
          });
      }
    }
  }, [location.pathname, dispatch, projects.length]);

  // Set up the intersection observer for infinite scrolling
  const lastProjectCallback = useCallback((node: HTMLAnchorElement | null) => {
    if (loading) return;
    
    if (observerRef.current) observerRef.current.disconnect();
    
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        // Load more projects when the last item is visible
        if (!loading) {
          const offset = page * 10;
          dispatch(fetchProjects({ limit: 10, offset }))
            .then((action) => {
              // Safely access pagination data
              const payload = action.payload as any;
              if (action.type === fetchProjects.fulfilled.type && payload.pagination) {
                setHasMore(payload.pagination.has_more);
                setPage(prev => prev + 1);
              }
            });
        }
      }
    });
    
    if (node) observerRef.current.observe(node);
    lastProjectRef.current = node;
  }, [loading, hasMore, page, dispatch]);

  const handleCategoryClick = (item: ItemType): void => {
    setActiveCategory(item.id || '');
    if (item.id === 'due-diligence') {
      const newID = getUniqueID();
      dispatch(setActiveProject({ id: '', name: '', temp_project_id: newID }));
      
      // Reset pagination state
      setPage(0);
      setHasMore(true);
      
      // Fetch initial projects when switching to due-diligence
      dispatch(fetchProjects({ limit: 10, offset: 0 }))
        .then((action) => {
          // Safely access pagination data
          const payload = action.payload as any;
          if (action.type === fetchProjects.fulfilled.type && payload.pagination) {
            setHasMore(payload.pagination.has_more);
            setPage(1);
          }
        });
      
      // Open the history dropdown automatically when clicking due-diligence
      setIsHistoryOpen(true);
    } else {
      // Close history dropdown when clicking other items
      setIsHistoryOpen(false);
    }
    navigate(item.url);
  };

  const toggleHistory = () => {
    setIsHistoryOpen(!isHistoryOpen);
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
        <nav className="h-screen space-y-2 font-medium mt-2 overflow-y-auto">
          <div className="space-y-2">
            <h6 className="font-semibold text-sm">Workflows</h6>
            <div className="space-y-1">
              {items.map((item: ItemType) => {
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
                    
                    {/* Show history dropdown only for due-diligence category */}
                    {isActive && item.id === 'due-diligence' && (
                      <div className="ml-4 mt-2">
                        {/* <button 
                          onClick={toggleHistory} 
                          className="flex items-center space-x-2 p-1 text-sm font-semibold text-gray-500 hover:bg-gray-100 rounded"
                        >
                          <div className={`transform transition-transform duration-300 ${isHistoryOpen ? 'rotate-180' : 'rotate-0'}`}>
                            <ChevronDown className="w-4 h-4" />
                          </div>
                          <span>History</span>
                        </button> */}
                        
                        <div 
                          className={`ml-2 mt-1 space-y-1 overflow-hidden transition-all duration-300 ease-in-out ${
                            isHistoryOpen ? 'max-h-72 opacity-100' : 'max-h-0 opacity-0'
                          }`}
                        >
                          {/* Fixed height container with scroll */}
                          <div className="h-72 overflow-y-auto pr-1 space-y-1">
                            {loading && projects.length === 0 ? (
                              <span className="flex text-xs items-center justify-center space-x-2 p-2 min-w-10 rounded">
                                <Loader className="w-4 h-4 text-gray-600 animate-spin" />
                              </span>
                            ) : (
                              <div className="space-y-1">
                                {projects.map((item, index) => {
                                  // Determine if this is the last item to observe
                                  const isLastItem = index === projects.length - 1;
                                  
                                  return (
                                    <NavLink
                                      key={item.id}
                                      ref={isLastItem ? lastProjectCallback : null}
                                      to={`/r/${item.id}`}
                                      onClick={() => {
                                        dispatch(setActiveProject(item));
                                      }}
                                      className={`flex text-xs items-center space-x-2 p-2 min-w-10 hover:bg-gray-200 rounded ${activeProjectId?.id === item.id ? 'bg-gray-200' : ''}`}
                                    >
                                      <div className="truncate w-[95%]">{item.name}</div>
                                    </NavLink>
                                  );
                                })}
                                
                                {/* Loading indicator for pagination */}
                                {loading && projects.length > 0 && (
                                  <div className="flex justify-center py-2">
                                    <Loader className="w-4 h-4 text-gray-600 animate-spin" />
                                  </div>
                                )}
                                
                                {/* End of list message
                                {!hasMore && projects.length > 0 && (
                                  <div className="text-xs text-center text-gray-400 py-2">
                                    No more projects
                                  </div>
                                )} */}
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