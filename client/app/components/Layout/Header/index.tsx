import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@radix-ui/react-dropdown-menu';
import { UserCircle, CircleUserRound, Settings,LogOut, Sparkles } from 'lucide-react';
import { useNavigate } from '@remix-run/react';


export default function Header() {
  const navigate = useNavigate();
  const handleLogout = () => {
    localStorage.removeItem('authToken');
    navigate("/login");
  };
  return (
    <div className="bg-gray-100 dark:bg-gray-900 p-4 flex justify-between items-center">
      <div className='text-lg font-semibold'>Omega Intelligence</div>
      <div className="flex items-center">
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center space-x-2">
            <UserCircle />
            
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end' className='w-48 bg-white border rounded-lg shadow-md p-2 space-y-1'>
            <DropdownMenuItem className='flex items-center space-x-2 px-3 py-2 hover:bg-gray-200 rounded border-none'>
              <CircleUserRound /> <div>Account</div>
            </DropdownMenuItem>
            <DropdownMenuItem className='flex items-center space-x-2 px-3 py-2 hover:bg-gray-200 rounded border-none'>
              <Settings /> <div>Settings</div>
            </DropdownMenuItem>
            <DropdownMenuItem className='flex items-center space-x-2 px-3 py-2 hover:bg-gray-200 rounded border-none'>
              <Sparkles /> <div>Upgrade Plan</div>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={()=>{handleLogout()}} className='flex items-center space-x-2 px-3 py-2 hover:bg-gray-200 rounded border-none'>
              <LogOut /> <div>Logout</div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}