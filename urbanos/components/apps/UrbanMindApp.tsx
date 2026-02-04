'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, Sparkles, X, MapPin, Zap } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';

interface Message {
    id: string;
    role: 'user' | 'model';
    text: string;
    timestamp: Date;
}

export default function UrbanMindApp() {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            role: 'model',
            text: "Hello! I am UrbanMind, your city's operating intelligence. I'm monitoring air quality, traffic, and safety in real-time. How can I assist you?",
            timestamp: new Date(),
        }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const sendMessage = async () => {
        if (!input.trim() || loading) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            text: input,
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            // Gather Context
            const { data: pollution } = await supabase.from('pollution_data').select('*').order('created_at', { ascending: false }).limit(1).single();
            const { data: reports } = await supabase.from('reports').select('*').order('created_at', { ascending: false }).limit(5);

            // Prepare context object
            const context = {
                aqi: pollution?.aqi_value || 50,
                aqiLevel: pollution?.level || 'Good',
                incidents: reports?.map(r => ({ type: r.type, location: r.location, desc: r.description })) || []
            };

            // Call AI API (We need to create a new route or update existing one to expose chatWithUrbanMind)
            // For now, let's assume we update the chat API endpoint to handle this method
            // But since we can't easily change the API route signature without breaking other things, 
            // we will send the context as part of the message body to a generic chat endpoint, 
            // OR we create a new endpoint `/api/urban-mind/chat`.

            // Let's use the existing `/api/chat` but pass a flag or enhanced body if supported.
            // Or better, let's just create the route `/api/chat/urban-mind` in the next step.
            const response = await fetch('/api/chat/urban-mind', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userMsg.text,
                    history: messages.map(m => ({ role: m.role, parts: m.text })),
                    context: context
                })
            });

            const data = await response.json();

            const botMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'model',
                text: data.response || "I lost connection to the city grid.",
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, botMsg]);
        } catch (error) {
            console.error('Chat error:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-gradient-to-b from-slate-900/50 to-slate-900/80 backdrop-blur-md text-white">
            {/* Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center border border-indigo-500/50">
                        <Sparkles className="w-4 h-4 text-indigo-400" />
                    </div>
                    <div>
                        <h3 className="font-bold text-sm">UrbanMind Core</h3>
                        <div className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                            <span className="text-[10px] opacity-70 uppercase tracking-wider">Online • Monitoring</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => (
                    <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div
                            className={`max-w-[80%] rounded-2xl p-3 text-sm ${msg.role === 'user'
                                    ? 'bg-indigo-600 text-white rounded-br-none'
                                    : 'bg-white/10 border border-white/10 text-white/90 rounded-bl-none'
                                }`}
                        >
                            {msg.text}
                        </div>
                    </motion.div>
                ))}
                {loading && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                        <div className="bg-white/5 border border-white/5 rounded-2xl rounded-bl-none p-3 flex gap-1">
                            <span className="w-1.5 h-1.5 bg-white/50 rounded-full animate-bounce"></span>
                            <span className="w-1.5 h-1.5 bg-white/50 rounded-full animate-bounce delay-100"></span>
                            <span className="w-1.5 h-1.5 bg-white/50 rounded-full animate-bounce delay-200"></span>
                        </div>
                    </motion.div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-white/10">
                <div className="relative">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                        placeholder="Ask UrbanMind about the city..."
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-4 pr-12 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-indigo-500/50 focus:bg-white/10 transition-all"
                    />
                    <button
                        onClick={sendMessage}
                        disabled={!input.trim() || loading}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-indigo-500 rounded-lg text-white disabled:opacity-50 hover:bg-indigo-600 transition-colors"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
