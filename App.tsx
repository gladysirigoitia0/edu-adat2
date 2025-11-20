import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { LandingPage } from './views/LandingPage';
import { StudentDashboard } from './views/StudentDashboard';
import { TeacherDashboard } from './views/TeacherDashboard';
import { AuthPage } from './views/AuthPage';
import { UserRole, User } from './types';

const App: React.FC = () => {
  // Auth State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authMode, setAuthMode] = useState<UserRole | null>(null); // Which role is trying to login

  const handleInitiateLogin = (role: UserRole) => {
    setAuthMode(role);
  };

  const handleLoginSuccess = (username: string) => {
    if (authMode) {
      setCurrentUser({ username, role: authMode });
      setAuthMode(null);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setAuthMode(null);
  };

  // Logic to determine what to show
  // 1. If user is attempting to login (AuthMode is set), show Auth Page
  if (authMode) {
    return (
      <AuthPage 
        targetRole={authMode} 
        onLoginSuccess={handleLoginSuccess} 
        onCancel={() => setAuthMode(null)}
      />
    );
  }

  // 2. If user is logged in, show their dashboard
  const renderContent = () => {
    if (!currentUser) return <LandingPage />;

    switch (currentUser.role) {
      case UserRole.STUDENT:
        return <StudentDashboard currentUser={currentUser} />;
      case UserRole.TEACHER:
        return <TeacherDashboard currentUser={currentUser} />;
      default:
        return <LandingPage />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <Navbar 
        currentRole={currentUser?.role || UserRole.GUEST} 
        onLogout={handleLogout} 
        onRoleSwitch={handleInitiateLogin} 
      />
      <main className="animate-fade-in">
        {renderContent()}
      </main>
      
      {/* Simple Footer - Only show on Landing */}
      {!currentUser && (
        <footer className="bg-slate-900 text-slate-400 py-8 text-center text-sm">
          <p>© 2023 EduAdapt - Escuela Técnica N°2 Ceferino Namuncurá</p>
        </footer>
      )}
    </div>
  );
};

export default App;
