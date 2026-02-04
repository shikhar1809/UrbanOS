'use client';

import { motion } from 'framer-motion';
import { Heart, Activity, Wind } from 'lucide-react';

export default function HealthVisualizer({ aqi }: { aqi: number }) {
    // Determine health state
    const state =
        aqi <= 50 ? { color: '#10b981', label: 'Healthy', description: 'Perfect conditions for outdoor activities.' } :
            aqi <= 100 ? { color: '#f59e0b', label: 'Moderate', description: 'Sensitive individuals should limit prolonged exertion.' } :
                aqi <= 150 ? { color: '#f97316', label: 'Unhealthy', description: 'General public may feel irritation.' } :
                    aqi <= 200 ? { color: '#ef4444', label: 'Critical', description: 'Increased risk for everyone. Wear a mask.' } :
                        { color: '#7f1d1d', label: 'Hazardous', description: 'Health warning: Emergency conditions.' };

    return (
        <div className="bg-foreground/5 rounded-xl p-6 border border-foreground/10 relative overflow-hidden">
            {/* Background Pulse */}
            <motion.div
                animate={{ opacity: [0.1, 0.3, 0.1] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0 bg-gradient-to-br from-transparent to-current opacity-10 pointer-events-none"
                style={{ color: state.color }}
            />

            <div className="flex items-start justify-between relative z-10">
                <div>
                    <h4 className="font-semibold text-lg flex items-center gap-2">
                        <Activity className="w-5 h-5" style={{ color: state.color }} />
                        Health Impact
                    </h4>
                    <p className="text-sm opacity-70 mt-1 max-w-md">{state.description}</p>
                </div>
                <div className="text-right">
                    <div className="text-2xl font-bold" style={{ color: state.color }}>{state.label}</div>
                    <div className="text-xs opacity-50 uppercase tracking-wider">Lungs Status</div>
                </div>
            </div>

            {/* Visual Lungs / Heartbeat */}
            <div className="mt-6 flex justify-center py-4">
                <div className="relative">
                    <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: aqi > 150 ? 0.5 : 2, repeat: Infinity, ease: "easeInOut" }} // Faster beat for worse air
                    >
                        <Heart className="w-24 h-24 drop-shadow-lg" style={{ color: state.color, fill: `${state.color}20` }} />
                    </motion.div>

                    {/* Particles if bad air */}
                    {aqi > 100 && (
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                            className="absolute inset-0 flex items-center justify-center opacity-50"
                        >
                            <Wind className="w-32 h-32 absolute animate-pulse text-gray-500/30" />
                        </motion.div>
                    )}
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="bg-white/5 rounded-lg p-3 text-center border border-white/5">
                    <div className="text-xs opacity-60 uppercase">Breathing Risk</div>
                    <div className="font-bold text-lg" style={{ color: state.color }}>
                        {aqi > 150 ? 'High' : aqi > 100 ? 'Moderate' : 'Low'}
                    </div>
                </div>
                <div className="bg-white/5 rounded-lg p-3 text-center border border-white/5">
                    <div className="text-xs opacity-60 uppercase">Mask Required</div>
                    <div className="font-bold text-lg" style={{ color: aqi > 100 ? '#ef4444' : '#10b981' }}>
                        {aqi > 100 ? 'Yes' : 'No'}
                    </div>
                </div>
            </div>
        </div>
    );
}
