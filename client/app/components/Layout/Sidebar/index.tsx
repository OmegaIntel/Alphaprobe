import { ChevronsRight, ChevronsLeft, PlusCircle } from 'lucide-react';
import { NavLink } from '@remix-run/react';
import { useState } from 'react';
import { items, ItemType } from './SidebarItems';
import { Button } from '~/components/ui/button';
import { useNavigate } from '@remix-run/react';
import { useSelector } from 'react-redux';
import { RootState } from '~/store/store';

type SidebarProps = {
  collapsed: boolean;
  setCollapsed: () => void;
};



export default function Sidebar({ collapsed, setCollapsed }: SidebarProps) {
  const [activeMenu, setActiveMenu] = useState<string>('new');
  const navigate = useNavigate();
  const { isCanvas, projects, activeProjectId } = useSelector((state: RootState) => state.sidebar)

  const onClick = (e: ItemType): void => {
    setActiveMenu(e.id as string);
  };

  return (
    <div
      className={`h-screen text-gray-600 shadow-lg p-4 flex flex-col transition-all duration-300 ${collapsed ? 'w-16' : 'w-72'} ${isCanvas && 'hidden'}`}
    >
      <div
        className={`flex items-center justify-between mb-4 ${collapsed ? 'flex-col space-y-2' : ''}`}
      >
        {!collapsed && (
          <button
            onClick={() => {
              navigate('./');
            }}
            className="p-1 rounded hover:bg-gray-200 text-sm font-medium space-x-2 items-center flex"
          >
            <PlusCircle className="w-5 h-5" />
            <div className="font-semibold">{'Create New Document'}</div>
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
            }}
            className="p-1 rounded hover:bg-gray-200 text-xl font-medium items-center"
          >
            <PlusCircle className="w-5 h-5" />
          </button>
        )}
      </div>

      {!collapsed && (
        <nav className="h-screan space-y-2 font-medium mt-2">
          <div>
            <h6 className="font-semibold text-sm">Your Projects</h6>
          </div>

          {items.map((item) => {
            const isActive = activeMenu === item.id;
            return (
              <NavLink
                to={`/${item.id}`}
                onClick={() => {
                  onClick(item);
                }}
                className={`flex text-sm items-center space-x-2 p-2 min-w-10 hover:bg-gray-200 rounded ${isActive ? 'bg-gray-200' : ''}`}
              >
                <div>{item.label}</div>
              </NavLink>
            );
          })}
        </nav>
      )}
    </div>
  );
}

//import { Menu, X } from 'lucide-react';

// export default function Sidebar({ collapsed }: SidebarProps) {
//   return (
//     <div className={`bg-gray-800 text-white ${collapsed ? 'w-20' : 'w-64'} transition-all duration-200`}>
//       <div className="flex justify-between items-center p-4">
//         <span>Logo</span>
//         <button>{collapsed ? <Menu /> : <X />}</button>
//       </div>
//       <nav className="p-4">
//         {/* Add your menu items here */}
//       </nav>
//     </div>
//   );
// }
