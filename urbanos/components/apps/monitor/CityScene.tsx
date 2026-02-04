'use client';

import { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF, OrbitControls, Stars, Cloud, Environment, PerspectiveCamera, Html } from '@react-three/drei';
import * as THREE from 'three';
import { supabase } from '@/lib/supabase';
import { Report } from '@/types';
import { motion } from 'framer-motion';
import { fetchGoogleWeather, GoogleWeatherData } from '@/lib/services/google-environment-api';

// Weather System Component
function WeatherSystem({ condition }: { condition: string }) {
    const rainCount = condition === 'STORM' ? 3000 : condition === 'RAIN' ? 1500 : 0;
    const isStorm = condition === 'STORM';

    const rainGeo = useRef<THREE.BufferGeometry>(null);

    useFrame((state) => {
        if (rainGeo.current) {
            const positions = rainGeo.current.attributes.position.array as Float32Array;
            for (let i = 1; i < positions.length; i += 3) {
                positions[i] -= 0.5 + Math.random() * 0.5; // Fall speed
                if (positions[i] < 0) positions[i] = 40; // Reset height
            }
            rainGeo.current.attributes.position.needsUpdate = true;
        }
    });

    if (rainCount === 0) return null;

    return (
        <group>
            {/* Rain Particles */}
            <points>
                <bufferGeometry ref={rainGeo}>
                    <bufferAttribute
                        attach="attributes-position"
                        args={[new Float32Array(rainCount * 3).map(() => (Math.random() - 0.5) * 80), 3]}
                    />
                </bufferGeometry>
                <pointsMaterial
                    color="#aaddff"
                    size={0.1}
                    transparent
                    opacity={0.6}
                    blending={THREE.AdditiveBlending}
                />
            </points>

            {/* Lightning for Storm */}
            {isStorm && <LightningFlash />}
        </group>
    );
}

function LightningFlash() {
    const light = useRef<THREE.PointLight>(null);
    useFrame((state) => {
        if (light.current) {
            if (Math.random() > 0.95) {
                light.current.intensity = 10 + Math.random() * 20;
                light.current.position.set((Math.random() - 0.5) * 50, 40, (Math.random() - 0.5) * 50);
            } else {
                light.current.intensity = THREE.MathUtils.lerp(light.current.intensity, 0, 0.2);
            }
        }
    });
    return <pointLight ref={light} distance={100} color="#aaddff" />;
}

// Incident Marker Component
function IncidentMarker({ position, type, onClick }: { position: [number, number, number], type: string, onClick: () => void }) {
    const ref = useRef<THREE.Group>(null);
    const [hovered, setHovered] = useState(false);

    useFrame((state) => {
        if (ref.current) {
            ref.current.rotation.y += 0.02;
            ref.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.2;
        }
    });

    const color =
        type === 'pothole' ? '#ef4444' :
            type === 'garbage' ? '#eab308' :
                type === 'fire' ? '#f97316' :
                    '#3b82f6';

    return (
        <group position={position} ref={ref} onClick={onClick} onPointerOver={() => setHovered(true)} onPointerOut={() => setHovered(false)}>
            <mesh position={[0, 0.5, 0]}>
                <octahedronGeometry args={[0.5]} />
                <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2} />
            </mesh>
            <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0.3, 0.4, 32]} />
                <meshBasicMaterial color={color} transparent opacity={0.5} />
            </mesh>
            {hovered && (
                <Html position={[0, 1.5, 0]} center>
                    <div className="bg-black/80 text-white px-2 py-1 rounded text-xs whitespace-nowrap backdrop-blur-md border border-white/20">
                        {type.toUpperCase()}
                    </div>
                </Html>
            )}
        </group>
    );
}

// Main City Model Component
function CityModel({ pollutionLevel }: { pollutionLevel: number }) {
    const { scene } = useGLTF('/SF Street.glb');
    const cityRef = useRef<THREE.Group>(null);

    // Clone scene to avoid mutation issues if reused
    const clonedScene = scene.clone();

    return (
        <group ref={cityRef} scale={[0.1, 0.1, 0.1]}> {/* Adjust scale as needed */}
            <primitive object={clonedScene} />
        </group>
    );
}

// Pollution Fog Component
function PollutionFog({ level }: { level: number }) {
    // Level 0-500 (AQI). 
    // 0-50: clear, 300+: heavy red fog

    const color = level > 200 ? '#7f1d1d' : level > 150 ? '#ef4444' : level > 100 ? '#f97316' : '#ffffff';
    const density = Math.min(level / 1000, 0.1); // Cap density

    return <fog attach="fog" args={[color, 5, 80 - (level / 10)]} />;
}

export default function CityScene() {
    const [pollutionData, setPollutionData] = useState<any>(null);
    const [incidents, setIncidents] = useState<Report[]>([]);
    const [selectedIncident, setSelectedIncident] = useState<Report | null>(null);
    const [weather, setWeather] = useState<GoogleWeatherData | null>(null);
    const [weatherLoading, setWeatherLoading] = useState(false);

    // Weather toggle for demo purposes
    const toggleWeather = () => {
        const states: ('CLEAR' | 'RAIN' | 'STORM')[] = ['CLEAR', 'RAIN', 'STORM'];
        const next = states[(states.indexOf(weather?.condition as any) + 1) % states.length] || 'CLEAR';
        setWeather(prev => prev ? { ...prev, condition: next } : { condition: next, temperature: 25, humidity: 60, windSpeed: 10, isDay: true });
    };

    useEffect(() => {
        // Determine pollution data
        const fetchPollution = async () => {
            const { data } = await supabase.from('pollution_data').select('*').order('created_at', { ascending: false }).limit(1).single();
            if (data) setPollutionData(data);
        };

        const fetchIncidents = async () => {
            // Fetch incidents that have location data (mocking 3D positions for demo)
            const { data } = await supabase.from('reports').select('*').limit(20);
            if (data) setIncidents(data);
        };

        const fetchWeather = async () => {
            setWeatherLoading(true);
            // Default location Lucknow
            const data = await fetchGoogleWeather(26.8467, 80.9462);
            setWeather(data);
            setWeatherLoading(false);
        };

        fetchPollution();
        fetchIncidents();
        fetchWeather();
    }, []);

    const aqi = pollutionData?.aqi_value || 50;
    const condition = weather?.condition || 'CLEAR';

    return (
        <div className="w-full h-full relative">
            <Canvas shadows dpr={[1, 2]}>
                <PerspectiveCamera makeDefault position={[0, 20, 30]} fov={50} />
                <OrbitControls
                    enablePan={true}
                    enableZoom={true}
                    minPolarAngle={0}
                    maxPolarAngle={Math.PI / 2.2}
                    autoRotate={false}
                />

                {/* Environment */}
                <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
                <ambientLight intensity={0.5} />
                <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
                <Environment preset="city" />

                {/* City & Pollution */}
                <CityModel pollutionLevel={aqi} />
                {/* City & Pollution */}
                <CityModel pollutionLevel={aqi} />
                <PollutionFog level={aqi} />
                <WeatherSystem condition={condition} />

                {/* Clouds to simulate smog layers */}
                {aqi > 100 && (
                    <Cloud position={[0, 10, 0]} opacity={0.5} speed={0.2} color={aqi > 200 ? "#5c2b2b" : "#cfcfcf"} />
                )}

                {/* Dynamic Incidents - Randomly placing them for demo since we don't have real 3D coords map */}
                {incidents.map((incident, i) => {
                    // Deterministic random position based on ID
                    const seed = incident.id.charCodeAt(0) + i;
                    const x = (seed % 40) - 20;
                    const z = ((seed * 2) % 40) - 20;

                    return (
                        <IncidentMarker
                            key={incident.id}
                            position={[x, 1, z]}
                            type={incident.type}
                            onClick={() => setSelectedIncident(incident)}
                        />
                    );
                })}
            </Canvas>

            {/* UI Overlay for Details */}
            {selectedIncident && (
                <div className="absolute bottom-4 left-4 p-4 glass-effect rounded-xl max-w-xs border border-white/20 text-white animate-in slide-in-from-bottom-5">
                    <h3 className="font-bold text-lg capitalize">{selectedIncident.type}</h3>
                    <p className="text-sm opacity-80 mb-2">{selectedIncident.description}</p>
                    <div className="flex gap-2">
                        <span className="px-2 py-0.5 bg-white/20 rounded text-xs">Lat: {selectedIncident.location.lat.toFixed(4)}</span>
                        <span className="px-2 py-0.5 bg-white/20 rounded text-xs">{new Date(selectedIncident.created_at).toLocaleDateString()}</span>
                    </div>
                    <button
                        onClick={() => setSelectedIncident(null)}
                        className="absolute top-2 right-2 text-white/50 hover:text-white"
                    >
                        ✕
                    </button>
                </div>
            )}

            <div className="absolute top-4 right-4 flex flex-col gap-2 items-end">
                {/* Weather Badge */}
                <div onClick={toggleWeather} className="p-3 glass-effect rounded-xl border border-white/20 text-white flex flex-col items-end cursor-pointer hover:bg-white/10 transition-colors">
                    <span className="text-xs uppercase tracking-wider opacity-70">Weather (Click to Toggle)</span>
                    <div className="flex items-center gap-2">
                        <span className="text-xl font-bold">{condition}</span>
                        {weather?.temperature && <span className="text-lg">{weather.temperature}°C</span>}
                    </div>
                </div>

                {/* Pollution Badge */}
                <div className="p-3 glass-effect rounded-xl border border-white/20 text-white flex flex-col items-end">
                    <span className="text-xs uppercase tracking-wider opacity-70">Air Quality</span>
                    <span className="text-2xl font-bold" style={{ color: aqi > 150 ? '#ef4444' : aqi > 100 ? '#f97316' : '#22c55e' }}>
                        {aqi} AQI
                    </span>
                    <span className="text-xs opacity-70">Lucknow Central</span>
                </div>
            </div>
        </div>
    );
}

useGLTF.preload('/SF Street.glb');
