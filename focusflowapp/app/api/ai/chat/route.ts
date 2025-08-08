import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// API key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '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',
});

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Create a study-focused system prompt
    const systemPrompt = `You are an AI Study Assistant for FocusFlow, a productivity app for students. Your role is to:

1. Help students with academic subjects (math, science, history, literature, etc.)
2. Provide effective study strategies and techniques
3. Explain complex concepts in simple terms
4. Offer time management and productivity advice
5. Encourage good study habits and learning practices

Keep responses helpful, educational, and encouraging. Use clear, concise language. If asked about non-academic topics, gently redirect to study-related subjects.`;

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message }
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    const response = completion.choices[0]?.message?.content || 'Sorry, I couldn\'t generate a response. Please try again.';

    return NextResponse.json({ response });
  } catch (error: any) {
    console.error('AI Chat API Error:', error);
    
    // Handle specific OpenAI errors
    if (error.code === 'invalid_api_key') {
      return NextResponse.json(
        { error: 'Invalid API key. Please check your OpenAI configuration.' },
        { status: 401 }
      );
    }
    
    if (error.code === 'rate_limit_exceeded') {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to get AI response. Please try again.' },
      { status: 500 }
    );
  }
} 