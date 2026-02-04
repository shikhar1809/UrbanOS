'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import { Layout } from 'lucide-react';

const CityScene = dynamic(() => import('./monitor/CityScene'), {
    ssr: false,
    loading: () => (
        <div className="flex items-center justify-center h-full w-full bg-black/90 text-white">
            <div className="flex flex-col items-center gap-4">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm tracking-widest uppercase">Initializing UrbanVision Core...</p>
            </div>
        </div>
    )
});

export default function CityMonitorApp() {
    return (
        <div className="h-full w-full bg-black relative overflow-hidden flex flex-col">
            {/* Header overlay */}
            <div className="absolute top-0 left-0 right-0 z-10 p-4 pointer-events-none">
                <div className="flex justify-center">
                    <div className="glass-effect rounded-full px-4 py-2 border border-white/10 text-white/80 text-xs font-mono tracking-widest flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                        LIVE CITS FEED • LUCKNOW
                    </div>
                </div>
            </div>

            <div className="flex-1 relative">
                <CityScene />
            </div>

            {/* Instructions Overlay */}
            <div className="absolute bottom-4 right-4 z-10 pointer-events-none opacity-50">
                <div className="text-[10px] text-white font-mono text-right">
                    <p>LMB DRAG : ROTATE</p>
                    <p>RMB DRAG : PAN</p>
                    <p>SCROLL : ZOOM</p>
                </div>
            </div>
        </div>
    );
}
