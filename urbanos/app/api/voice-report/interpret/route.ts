import { NextRequest, NextResponse } from 'next/server';
import { aiService } from '@/lib/services/ai-service';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { text } = body;

        if (!text) {
            return NextResponse.json(
                { error: 'Text input is required' },
                { status: 400 }
            );
        }

        // Call Gemini AI service
        const analysis = await aiService.interpretVoiceReport(text);

        return NextResponse.json({
            success: true,
            analysis,
        });
    } catch (error: any) {
        console.error('Voice interpret API error:', error);
        return NextResponse.json(
            { error: 'Failed to interpret voice input', details: error.message },
            { status: 500 }
        );
    }
}
