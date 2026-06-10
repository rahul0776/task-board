import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './services/AuthContext.tsx';
import LandingPage from './pages/LandingPage.tsx';
import Dashboard from './components/Dashboard.tsx';
import Board from './components/Board.tsx';
import Layout from './components/Layout.tsx';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public marketing page — rendered without the app chrome */}
          <Route path="/" element={<LandingPage />} />
          <Route
            path="/dashboard"
            element={
              <Layout>
                <Dashboard />
              </Layout>
            }
          />
          <Route
            path="/board/:id"
            element={
              <Layout>
                <Board />
              </Layout>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
