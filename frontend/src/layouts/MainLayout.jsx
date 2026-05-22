import React, { useState } from 'react';
import { BarChart3, Brain, Home, Menu, MessageSquareText, Mic, X } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { BackgroundFX } from '../components/BackgroundFX';

const defaultNavItems = [
  { key: 'home', label: 'Home Dashboard', icon: Home },
  { key: 'interview-types', label: 'Interview Types', icon: MessageSquareText },
  { key: 'mock-interview', label: 'Mock Interview', icon: Mic },
  { key: 'aptitude-test', label: 'Aptitude Test', icon: Brain },
  { key: 'analysis-dashboard', label: 'AI Analysis', icon: BarChart3 },
];

export function MainLayout({ children, showSidebar = true, activeView, onNavigate, navItems = defaultNavItems }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { theme } = useTheme();

  return (
    <div
      style={{
        backgroundColor: theme.colors.bgPrimary,
        color: theme.colors.textPrimary,
        fontFamily: theme.fonts.family.sans,
        minHeight: '100vh',
        display: 'flex',
        position: 'relative',
      }}
    >
      <BackgroundFX />
      {/* Sidebar */}
      {showSidebar && (
        <>
          {/* Mobile toggle */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{
              position: 'fixed',
              top: '1rem',
              left: '1rem',
              zIndex: 50,
              display: 'none',
            }}
            className="lg:hidden"
          >
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          {/* Sidebar panel */}
          <div
            style={{
              width: sidebarOpen ? '280px' : '0',
              backgroundColor: theme.colors.bgSecondary,
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              borderRight: `1px solid ${theme.colors.borderLight}`,
              transition: `width 300ms ${theme.transitions.base}`,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              padding: sidebarOpen ? '2rem 1.5rem' : '0',
              zIndex: 10,
            }}
            className="fixed lg:static lg:w-64 h-screen top-0 left-0 z-40"
          >
            {/* Logo */}
            <div style={{ marginBottom: '2rem' }}>
              <h2
                style={{
                  fontSize: theme.fonts.size['2xl'],
                  fontWeight: '900',
                  background: `linear-gradient(135deg, ${theme.colors.primary}, #0099FF)`,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                AptiSense AI
              </h2>
              <p style={{ fontSize: theme.fonts.size.sm, color: theme.colors.textTertiary }}>
                Recruitment Intelligence
              </p>
            </div>

            {/* Navigation */}
            <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {navItems.map((item) => (
                <SidebarButton
                  key={item.key}
                  icon={item.icon}
                  label={item.label}
                  active={activeView === item.key}
                  onClick={() => {
                    if (onNavigate) {
                      onNavigate(item.key);
                    }
                  }}
                />
              ))}
            </nav>

            {/* Footer */}
            <div style={{ borderTop: `1px solid ${theme.colors.borderLight}`, paddingTop: '1.5rem' }}>
              <p style={{ fontSize: theme.fonts.size.xs, color: theme.colors.textTertiary }}>
                v2.0.0
              </p>
            </div>
          </div>

          {/* Mobile overlay */}
          {sidebarOpen && (
            <div
              onClick={() => setSidebarOpen(false)}
              style={{
                position: 'fixed',
                inset: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                display: 'none',
                zIndex: 30,
              }}
              className="lg:hidden"
            />
          )}
        </>
      )}

      {/* Main content */}
      <main style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 1 }}>
        {children}
      </main>
    </div>
  );
}

function SidebarButton({ icon: Icon, label, active, onClick }) {
  const { theme } = useTheme();

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0.875rem 1rem',
        borderRadius: '0.5rem',
        fontSize: theme.fonts.size.sm,
        color: active ? theme.colors.textPrimary : theme.colors.textSecondary,
        backgroundColor: active ? `${theme.colors.primary}18` : 'transparent',
        border: `1px solid ${active ? `${theme.colors.primary}55` : 'transparent'}`,
        cursor: 'pointer',
        transition: `all ${theme.transitions.fast}`,
        textAlign: 'left',
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.backgroundColor = theme.colors.surfaceSecondary;
          e.currentTarget.style.color = theme.colors.primary;
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.color = theme.colors.textSecondary;
        }
      }}
    >
      <Icon size={18} />
      <span>{label}</span>
    </button>
  );
}
