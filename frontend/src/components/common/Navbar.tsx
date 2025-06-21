import React from 'react';
import { NavLink } from 'react-router-dom';

const Navbar: React.FC = () => {
  const activeLinkStyle = {
    fontWeight: 'bold',
    textDecoration: 'underline',
  };

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex-shrink-0">
            <span className="text-xl font-bold text-blue-600">Syllabus Tracker</span>
          </div>
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              <NavLink 
                to="/progress" 
                style={({ isActive }) => isActive ? activeLinkStyle : undefined}
                className="text-gray-600 hover:bg-gray-100 px-3 py-2 rounded-md text-sm font-medium"
              >
                Progress
              </NavLink>
              <NavLink 
                to="/teacher" 
                style={({ isActive }) => isActive ? activeLinkStyle : undefined}
                className="text-gray-600 hover:bg-gray-100 px-3 py-2 rounded-md text-sm font-medium"
              >
                Teacher Dashboard
              </NavLink>
              <NavLink 
                to="/admin" 
                style={({ isActive }) => isActive ? activeLinkStyle : undefined}
                className="text-gray-600 hover:bg-gray-100 px-3 py-2 rounded-md text-sm font-medium"
              >
                Admin Dashboard
              </NavLink>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 