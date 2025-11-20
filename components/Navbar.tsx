import React from 'react';
import { GraduationCap, LogOut, User } from 'lucide-react';
import { UserRole } from '../types';

interface NavbarProps {
  currentRole: UserRole;
  onLogout: () => void;
  onRoleSwitch: (role: UserRole) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentRole, onLogout, onRoleSwitch }) => {
  return (
    <nav className="bg-indigo-600 text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center cursor-pointer" onClick={() => onLogout()}>
            <GraduationCap className="h-8 w-8 mr-2" />
            <span className="font-bold text-xl tracking-tight">EduAdapt</span>
          </div>
          
          <div className="flex items-center space-x-4">
            {currentRole === UserRole.GUEST ? (
              <div className="flex space-x-2">
                <button 
                  onClick={() => onRoleSwitch(UserRole.STUDENT)}
                  className="px-3 py-2 rounded-md text-sm font-medium hover:bg-indigo-500 transition"
                >
                  Acceso Estudiante
                </button>
                <button 
                  onClick={() => onRoleSwitch(UserRole.TEACHER)}
                  className="px-3 py-2 rounded-md text-sm font-medium bg-indigo-800 hover:bg-indigo-700 transition"
                >
                  Acceso Docente
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <User className="h-5 w-5 mr-1" />
                  <span className="text-sm font-medium">
                    {currentRole === UserRole.STUDENT ? 'Panel Estudiante' : 'Panel Docente'}
                  </span>
                </div>
                <button 
                  onClick={onLogout}
                  className="flex items-center px-3 py-2 rounded-md text-sm font-medium bg-indigo-700 hover:bg-indigo-800 transition"
                >
                  <LogOut className="h-4 w-4 mr-1" />
                  Salir
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};