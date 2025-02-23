import { BrowserRouter as Router, Routes, Route, Link, NavLink, Navigate } from 'react-router-dom';
import { Auth0Provider, useAuth0 } from '@auth0/auth0-react';
import { LoginButton } from './components/Auth/LoginButton';
import { LogoutButton } from './components/Auth/LogoutButton';
import { ProtectedRoute } from './components/Auth/ProtectedRoute';
import LessonPlanForm from './components/LessonPlanForm';
import LessonPlanDisplay from './components/LessonPlanDisplay';
import LessonPlanList from './components/LessonPlanList';
import './App.css';

// Create a navigation component
const Navigation = () => {
  const { isAuthenticated } = useAuth0();
  
  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-bold">BC Lesson Planner</h1>
            {isAuthenticated && (
              <div className="ml-10 flex space-x-4">
                <NavLink to="/create" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md">
                  Create Plan
                </NavLink>
                <NavLink to="/plans" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md">
                  View Plans
                </NavLink>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-4">
            <LoginButton />
            <LogoutButton />
          </div>
        </div>
      </div>
    </nav>
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
    <div className="min-h-screen bg-gray-100">
      <Navigation />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <Routes>
          {/* Public route - only accessible when not authenticated */}
          <Route 
            path="/login" 
            element={
              isAuthenticated ? 
                <Navigate to="/plans" replace /> : 
                <div className="text-center py-10">
                  <h2 className="text-2xl font-bold mb-4">Welcome to BC Lesson Planner</h2>
                  <p className="mb-4">Please log in to continue</p>
                  <LoginButton />
                </div>
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