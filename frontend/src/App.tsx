import { BrowserRouter as Router, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { Auth0Provider, useAuth0 } from '@auth0/auth0-react';
import { LoginButton } from './components/Auth/LoginButton';
import { LogoutButton } from './components/Auth/LogoutButton';
import { ProtectedRoute } from './components/Auth/ProtectedRoute';
import LessonPlanForm from './components/LessonPlanForm';
import LessonPlanDisplay from './components/LessonPlanDisplay';
import LessonPlanList from './components/LessonPlanList';
import ReportCardFeedback from './components/ReportCardFeedback';
import Login from './components/Auth/Login';
import { useState } from 'react';
import './App.css';

// Create a navigation component
const Navigation = () => {
  const { isAuthenticated } = useAuth0();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };
  
  // Close menu when a link is clicked
  const handleNavLinkClick = () => {
    if (isMenuOpen) {
      setIsMenuOpen(false);
    }
  };

  // Close menu when clicking outside
  const handleOverlayClick = () => {
    setIsMenuOpen(false);
  };
  
  return (
    <>
      <nav className="nav">
        <div className="nav-left">
          <h1 className="nav-brand">BC Lesson Planner</h1>
          {isAuthenticated && (
            <>
              <button 
                className="mobile-menu-button" 
                onClick={toggleMenu}
                aria-label="Toggle navigation menu"
              >
                {isMenuOpen ? '✕' : '☰'}
              </button>
              <div className={`nav-links ${isMenuOpen ? 'open' : ''}`}>
                <NavLink 
                  to="/create" 
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                  onClick={handleNavLinkClick}
                >
                  Create Plan
                </NavLink>
                <NavLink 
                  to="/plans" 
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                  onClick={handleNavLinkClick}
                >
                  View Plans
                </NavLink>
                <NavLink 
                  to="/report-feedback" 
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                  onClick={handleNavLinkClick}
                >
                  Report Card
                </NavLink>
                <div className="mobile-logout">
                  <LogoutButton />
                </div>
              </div>
            </>
          )}
        </div>
        <div className="nav-right">
          <LoginButton />
          <div className="desktop-logout">
            <LogoutButton />
          </div>
        </div>
      </nav>
      {isAuthenticated && (
        <div 
          className={`menu-overlay ${isMenuOpen ? 'open' : ''}`} 
          onClick={handleOverlayClick}
        />
      )}
    </>
  );
};

// Main app content component
const AppContent = () => {
  const { isAuthenticated, isLoading } = useAuth0();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="app">
      <Navigation />
      <main>
        <Routes>
          {/* Public route - only accessible when not authenticated */}
          <Route 
            path="/login" 
            element={
              isAuthenticated ? 
                <Navigate to="/plans" replace /> : 
                <Login />
            } 
          />
          
          {/* Protected Routes */}
          <Route
            path="/create"
            element={
              <ProtectedRoute>
                <LessonPlanForm />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/plans"
            element={
              <ProtectedRoute>
                <LessonPlanList />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/lesson/:id"
            element={
              <ProtectedRoute>
                <LessonPlanDisplay />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/report-feedback"
            element={
              <ProtectedRoute>
                <ReportCardFeedback />
              </ProtectedRoute>
            }
          />
          
          {/* Redirect root based on auth status */}
          <Route 
            path="/" 
            element={
              isAuthenticated ? 
                <Navigate to="/plans" replace /> : 
                <Navigate to="/login" replace />
            } 
          />
        </Routes>
      </main>
    </div>
  );
};

function App() {
  return (
    <Auth0Provider
      domain={import.meta.env.VITE_AUTH0_DOMAIN}
      clientId={import.meta.env.VITE_AUTH0_CLIENT_ID}
      authorizationParams={{
        redirect_uri: `${window.location.origin}`,
        audience: import.meta.env.VITE_AUTH0_AUDIENCE,
        scope: 'openid profile email',
        returnTo: window.location.origin + '/login'
      }}
      useRefreshTokens={true}
      cacheLocation="localstorage"
    >
      <Router>
        <AppContent />
      </Router>
    </Auth0Provider>
  );
}

export default App;