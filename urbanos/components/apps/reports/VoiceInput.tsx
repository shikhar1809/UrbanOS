'use client';

import { useState, useRef } from 'react';
import { Mic, MicOff, Loader2, Sparkles } from 'lucide-react';
import { useToast } from '@/lib/toast-context';

interface VoiceInputProps {
    onAnalysisComplete: (data: any) => void;
}

export default function VoiceInput({ onAnalysisComplete }: VoiceInputProps) {
    const [isListening, setIsListening] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const recognitionRef = useRef<any>(null);
    const { showToast } = useToast();

    const startListening = () => {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            showToast('Voice input is not supported in this browser.', 'error');
            return;
        }

        // @ts-ignore
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.lang = 'en-US'; // Could accept 'hi-IN' later

        recognitionRef.current.onstart = () => {
            setIsListening(true);
        };

        recognitionRef.current.onresult = async (event: any) => {
            const transcript = event.results[0][0].transcript;
            console.log('Voice Input:', transcript);
            setIsListening(false);
            await processVoiceInput(transcript);
        };

        recognitionRef.current.onerror = (event: any) => {
            console.error('Speech recognition error', event.error);
            setIsListening(false);
            showToast('Voice recognition failed. Please try again.', 'error');
        };

        recognitionRef.current.onend = () => {
            setIsListening(false);
        };

        recognitionRef.current.start();
    };

    const stopListening = () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
            setIsListening(false);
        }
    };

    const processVoiceInput = async (text: string) => {
        setIsProcessing(true);
        try {
            const response = await fetch('/api/voice-report/interpret', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to analyze voice input');
            }

            showToast('AI analyzed your report!', 'success');
            onAnalysisComplete(data.analysis);
        } catch (error: any) {
            console.error('AI processing error:', error);
            showToast(error.message, 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="mb-6 p-4 bg-gradient-to-r from-windows-blue/10 to-purple-500/10 rounded-xl border border-windows-blue/20 flex flex-col items-center justify-center text-center">
            <div className="mb-2 text-sm font-semibold text-foreground/80 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-500" />
                AI Voice Assistant
            </div>
            <p className="text-xs text-foreground/60 mb-4 max-w-md">
                Tap the mic and say something like "There is a large pothole near the SBI bank in Indiranagar causing traffic."
            </p>

            <button
                type="button"
                onClick={isListening ? stopListening : startListening}
                disabled={isProcessing}
                className={`
          relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300
          ${isListening
                        ? 'bg-red-500 shadow-[0_0_20px_rgba(239,68,68,0.5)] animate-pulse'
                        : 'bg-windows-blue shadow-lg hover:shadow-xl hover:scale-105'}
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
            >
                {isProcessing ? (
                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                ) : isListening ? (
                    <MicOff className="w-8 h-8 text-white" />
                ) : (
                    <Mic className="w-8 h-8 text-white" />
                )}
            </button>

            <div className="mt-3 h-6 text-sm font-medium text-windows-blue">
                {isListening ? 'Listening...' : isProcessing ? 'AI is analyzing...' : ''}
            </div>
        </div>
    );
}
