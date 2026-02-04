import { NextRequest, NextResponse } from 'next/server';
import { aiService } from '@/lib/services/ai-service';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { reports } = body;

        if (!reports || !Array.isArray(reports)) {
            return NextResponse.json(
                { error: 'Valid reports array is required' },
                { status: 400 }
            );
        }

        const predictions = await aiService.generatePredictiveInsights(reports);

        return NextResponse.json({
            success: true,
            predictions,
        });
    } catch (error: any) {
        console.error('Prediction API error:', error);
        return NextResponse.json(
            { error: 'Failed to generate predictions', details: error.message },
            { status: 500 }
        );
    }
}
