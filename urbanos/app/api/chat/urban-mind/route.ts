import { NextRequest, NextResponse } from 'next/server';
import { aiService } from '@/lib/services/ai-service';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { message, history, context } = body;

        if (!message) {
            return NextResponse.json(
                { error: 'Message is required' },
                { status: 400 }
            );
        }

        const response = await aiService.chatWithUrbanMind(message, history || [], context || {});

        return NextResponse.json({
            success: true,
            response,
        });
    } catch (error: any) {
        console.error('UrbanMind API error:', error);
        return NextResponse.json(
            { error: 'Failed to process chat', details: error.message },
            { status: 500 }
        );
    }
}
