import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../services/AuthContext.tsx';

interface LayoutProps {
  children: React.ReactNode;
}

// App chrome — mirrors the landing page nav: dark blurred sticky bar,
// CSS logo mark, mono metadata. Pages themselves stay on the light theme.
const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { displayName } = useAuth();

  return (
    <div className="min-h-screen bg-surface">
      <nav className="sticky top-0 z-50 bg-[rgba(25,18,16,0.86)] backdrop-blur-[14px] border-b border-dark-line">
        <div className="max-w-[1140px] mx-auto px-8 h-16 flex items-center gap-7">
          <Link
            to="/"
            className="flex items-center gap-2.5 font-display font-bold text-[18px] text-dark-text mr-auto no-underline"
          >
            <span className="w-[26px] h-[26px] rounded-[7px] bg-accent-grad grid place-items-center">
              <span className="block w-2.5 h-2.5 rounded-[3px] border-2 border-white" />
            </span>
            TaskBoard
          </Link>

          <div className="hidden sm:flex gap-6">
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                `text-[15px] font-medium no-underline transition-colors duration-200 ${
                  isActive ? 'text-dark-text' : 'text-dark-muted hover:text-dark-text'
                }`
              }
            >
              Dashboard
            </NavLink>
          </div>

          <span
            className="font-mono text-[12.5px] text-dark-muted border border-dark-line rounded-lg px-[11px] py-1.5 bg-white/[0.03]"
            title="Anonymous session"
          >
            {displayName}
          </span>
        </div>
      </nav>

      <main className="max-w-[1140px] mx-auto px-8 py-10">{children}</main>
    </div>
  );
};

export default Layout;
