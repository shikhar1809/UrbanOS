'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Sparkles, User, Bot } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/lib/toast-context';

interface Message {
    role: 'user' | 'model';
    text: string;
}

export default function ChatApp() {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [messages, setMessages] = useState<Message[]>([
        { role: 'model', text: `Namaste ${user?.user_metadata?.full_name || 'Citizen'}! I am Nagar Mitra, your AI city assistant. How can I help you today?` }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
        setIsLoading(true);

        try {
            // Prepare history for context (exclude last user message which we are sending now)
            const history = messages.map(m => ({
                role: m.role,
                parts: m.text
            }));

            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userMessage,
                    history: history
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to get response');
            }

            setMessages(prev => [...prev, { role: 'model', text: data.response }]);
        } catch (error) {
            console.error('Chat error:', error);
            showToast('Nagar Mitra is having trouble connecting. Please try again.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-white/50 dark:bg-black/20 backdrop-blur-sm">
            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg, idx) => (
                    <div
                        key={idx}
                        className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                    >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-windows-blue' : 'bg-green-600'
                            }`}>
                            {msg.role === 'user' ? (
                                <User className="w-5 h-5 text-white" />
                            ) : (
                                <Bot className="w-5 h-5 text-white" />
                            )}
                        </div>
                        <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${msg.role === 'user'
                                ? 'bg-windows-blue text-white rounded-tr-none'
                                : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-foreground rounded-tl-none shadow-sm'
                            }`}>
                            {msg.text}
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center flex-shrink-0">
                            <Bot className="w-5 h-5 text-white" />
                        </div>
                        <div className="bg-white dark:bg-gray-800 col-span-2 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm border border-gray-200 dark:border-gray-700">
                            <div className="flex gap-1">
                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-black/40 backdrop-blur-md">
                <form onSubmit={handleSend} className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask Nagar Mitra..."
                        className="flex-1 px-4 py-2 rounded-xl bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-windows-blue text-foreground"
                        disabled={isLoading}
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || isLoading}
                        className="w-10 h-10 rounded-xl bg-windows-blue hover:bg-windows-blue-hover text-white flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                    </button>
                </form>
            </div>
        </div>
    );
}
