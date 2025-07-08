import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { keyphrase } = await request.json();

    if (!keyphrase || typeof keyphrase !== 'string') {
      return NextResponse.json(
        { error: 'Keyphrase is required' },
        { status: 400 }
      );
    }

    // Find or create user with the keyphrase
    const user = await DatabaseService.findOrCreateUser(keyphrase.trim());

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        keyphrase: user.keyphrase,
        created_at: user.created_at,
      },
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Login failed. Please try again.' },
      { status: 500 }
    );
  }
}
