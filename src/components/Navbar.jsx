import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, CheckSquare, Wallet, BookOpen } from 'lucide-react';
import logo from '../assets/valkaisikkallogos.png'; // Adjust the path as needed

const Navbar = () => {
  const location = useLocation();
  
  const navItems = [
    { path: '/', name: 'Dashboard', icon: LayoutDashboard },
    { path: '/task', name: 'Tasks', icon: CheckSquare },
    { path: '/finance', name: 'Finance', icon: Wallet },
    { path: '/study', name: 'Study', icon: BookOpen },
  ];

  return (
    <nav className="bg-[#0A0A0A] border-b border-[#2A2A2A] fixed w-full top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14">
          {/* Logo with Image */}
          <Link to="/" className="flex items-center space-x-2">
            <img 
              src={logo} 
              alt="Valkaisikkal" 
              className="h-14 w-auto" // Adjust height as needed
            />
            <span className="font-medium text-[#EDEDED]">Life Hub</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => { 
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`
                    flex items-center space-x-2 px-4 py-2 rounded-md text-sm transition-all duration-200
                    ${isActive 
                      ? 'bg-[#2A2A2A] text-[#EDEDED]' 
                      : 'text-[#9A9A9A] hover:text-[#EDEDED] hover:bg-[#1A1A1A]'
                    }
                  `}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>

          {/* User Menu */}
         
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0A0A0A] border-t border-[#2A2A2A]">
        <div className="flex justify-around items-center h-14">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  flex flex-col items-center justify-center flex-1 h-full
                  transition-colors duration-200
                  ${isActive ? 'text-[#EDEDED]' : 'text-[#6A6A6A]'}
                `}
              >
                <Icon className={`h-5 w-5 ${isActive ? 'text-blue-500' : ''}`} />
                <span className="text-xs mt-1">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;