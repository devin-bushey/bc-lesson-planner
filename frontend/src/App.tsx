import { BrowserRouter as Router, Routes, Route, Link, NavLink } from 'react-router-dom';
import LessonPlanForm from './components/LessonPlanForm';
import LessonPlanDisplay from './components/LessonPlanDisplay';
import LessonPlanList from './components/LessonPlanList';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app">
        <nav className="nav">
          <div className="nav-left">
            <Link to="/" className="nav-brand">BC Lesson Planner</Link>
            <div className="nav-links">
              <NavLink 
                to="/" 
                className={({ isActive }) => 
                  `nav-link ${isActive ? 'active' : ''}`
                }
                end
              >
                Create Plan
              </NavLink>
              <NavLink 
                to="/plans" 
                className={({ isActive }) => 
                  `nav-link ${isActive ? 'active' : ''}`
                }
              >
                View Plans
              </NavLink>
            </div>
          </div>
        </nav>
        <Routes>
          <Route path="/" element={<LessonPlanForm />} />
          <Route path="/plans" element={<LessonPlanList />} />
          <Route path="/lesson/:id" element={<LessonPlanDisplay />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;