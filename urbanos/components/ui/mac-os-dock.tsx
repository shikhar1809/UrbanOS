'use client';

import React from 'react';

// Types for the component
interface DockApp {
  id: string;
  name: string;
  icon: React.ReactNode;
}

interface MacOSDockProps {
  apps: DockApp[];
  onAppClick: (appId: string) => void;
  openApps?: string[];
  className?: string;
}

const MacOSDock: React.FC<MacOSDockProps> = ({ 
  apps, 
  onAppClick, 
  openApps = [],
  className = ''
}) => {
  const lastClickTime = React.useRef<number>(0);
  const lastClickedAppId = React.useRef<string | null>(null);

  const handleAppClick = (appId: string) => {
    const now = Date.now();
    
    // Prevent multiple rapid clicks
    if (now - lastClickTime.current < 300) {
      return;
    }
    
    // If clicking the same item that was just clicked, ignore
    if (lastClickedAppId.current === appId && now - lastClickTime.current < 500) {
      return;
    }
    
    lastClickTime.current = now;
    lastClickedAppId.current = appId;
    
    onAppClick(appId);
  };

  return (
    <div 
      className={`flex items-center gap-2 ${className}`}
    >
      {apps.map((app) => {
        const isActive = openApps.includes(app.id);
        
        return (
          <button
            key={app.id}
            onClick={() => handleAppClick(app.id)}
            className="relative flex items-center justify-center transition-all duration-200"
            title={app.name}
            style={{
              width: '56px',
              height: '40px',
              background: isActive 
                ? 'linear-gradient(135deg, #FFD700 0%, #FFEB3B 100%)' 
                : 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
              border: '3px solid #000000',
              borderRadius: '0px',
              boxShadow: isActive
                ? '4px 4px 0px 0px #000000, 0px 4px 12px rgba(0, 0, 0, 0.2)'
                : '2px 2px 0px 0px rgba(0, 0, 0, 0.3), 0px 2px 8px rgba(0, 0, 0, 0.15)',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.background = 'linear-gradient(135deg, #f0f0f0 0%, #e8e8e8 100%)';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '3px 3px 0px 0px rgba(0, 0, 0, 0.4), 0px 4px 12px rgba(0, 0, 0, 0.2)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.background = 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)';
                e.currentTarget.style.transform = 'translateY(0px)';
                e.currentTarget.style.boxShadow = '2px 2px 0px 0px rgba(0, 0, 0, 0.3), 0px 2px 8px rgba(0, 0, 0, 0.15)';
              }
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = 'translateY(1px)';
              e.currentTarget.style.boxShadow = isActive
                ? '2px 2px 0px 0px #000000, 0px 2px 6px rgba(0, 0, 0, 0.15)'
                : '1px 1px 0px 0px rgba(0, 0, 0, 0.3), 0px 1px 4px rgba(0, 0, 0, 0.1)';
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = isActive ? 'translateY(0px)' : 'translateY(-2px)';
              e.currentTarget.style.boxShadow = isActive
                ? '4px 4px 0px 0px #000000, 0px 4px 12px rgba(0, 0, 0, 0.2)'
                : '3px 3px 0px 0px rgba(0, 0, 0, 0.4), 0px 4px 12px rgba(0, 0, 0, 0.2)';
            }}
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {app.icon}
            </div>
            
            {/* Active Indicator - Bold square */}
            {isActive && (
              <div 
                className="absolute"
                style={{
                  bottom: '-8px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '8px',
                  height: '8px',
                  borderRadius: '0px',
                  backgroundColor: '#000000',
                  border: '2px solid #000000',
                  boxShadow: '3px 3px 0px 0px #000000',
                }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
};

export default MacOSDock;
