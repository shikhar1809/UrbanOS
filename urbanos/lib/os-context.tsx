'use client';

import React, { createContext, useContext, useState, useCallback, useRef, ReactNode } from 'react';

export type AppId = 'reports' | 'community' | 'predictor' | 'security' | 'profile' | 'notifications' | 'alerts' | 'pollution' | 'admin' | 'chat' | 'monitor';

interface OSContextType {
  activeApp: AppId | null;
  openApp: (appId: AppId) => void;
  closeApp: () => void;
  minimizeApp: () => void;
  notifications: number;
  setNotifications: (count: number) => void;
  zoomToReport: (lat: number, lng: number) => void;
  setZoomToReportHandler: (handler: (lat: number, lng: number) => void) => void;
}

const OSContext = createContext<OSContextType | undefined>(undefined);

export function OSProvider({ children }: { children: ReactNode }) {
  const [activeApp, setActiveApp] = useState<AppId | null>(null);
  const [notifications, setNotifications] = useState(0);
  // Use ref instead of state to avoid re-renders when handler changes
  const zoomToReportHandlerRef = useRef<((lat: number, lng: number) => void) | null>(null);

  const openApp = (appId: AppId) => {
    setActiveApp(appId);
  };

  const closeApp = () => {
    setActiveApp(null);
  };

  const minimizeApp = () => {
    setActiveApp(null);
  };

  const zoomToReport = useCallback((lat: number, lng: number) => {
    if (zoomToReportHandlerRef.current) {
      zoomToReportHandlerRef.current(lat, lng);
    }
  }, []);

  const setZoomToReportHandler = useCallback((handler: (lat: number, lng: number) => void) => {
    zoomToReportHandlerRef.current = handler;
  }, []);

  return (
    <OSContext.Provider
      value={{
        activeApp,
        openApp,
        closeApp,
        minimizeApp,
        notifications,
        setNotifications,
        zoomToReport,
        setZoomToReportHandler,
      }}
    >
      {children}
    </OSContext.Provider>
  );
}

export function useOS() {
  const context = useContext(OSContext);
  if (context === undefined) {
    throw new Error('useOS must be used within an OSProvider');
  }
  return context;
}

