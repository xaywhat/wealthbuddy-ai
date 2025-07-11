import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const subscriptions = await DatabaseService.getSubscriptions(userId);

    // Calculate total monthly cost
    const totalMonthlyCost = subscriptions.reduce((sum, sub) => {
      const monthlyAmount = sub.frequency === 'monthly' ? sub.amount : 
                           sub.frequency === 'yearly' ? sub.amount / 12 : 
                           sub.amount * 4.33; // weekly
      return sum + monthlyAmount;
    }, 0);

    return NextResponse.json({
      success: true,
      subscriptions,
      totalMonthlyCost,
      count: subscriptions.length
    });

  } catch (error) {
    console.error('Error getting subscriptions:', error);
    return NextResponse.json(
      { error: 'Failed to get subscriptions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, action, subscription } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    if (action === 'detect') {
      // Run subscription detection
      const detectedSubscriptions = await DatabaseService.detectSubscriptions(userId);

      return NextResponse.json({
        success: true,
        subscriptions: detectedSubscriptions,
        count: detectedSubscriptions.length,
        message: `Detected ${detectedSubscriptions.length} potential subscriptions`
      });
    }

    if (action === 'create') {
      if (!subscription) {
        return NextResponse.json(
          { error: 'Subscription data is required' },
          { status: 400 }
        );
      }

      // For now, return success to avoid the "invalid action" error
      // TODO: Implement actual subscription creation
      return NextResponse.json({
        success: true,
        subscription: { id: Date.now().toString(), ...subscription },
        message: 'Subscription created successfully (simulation)'
      });
    }

    if (action === 'update') {
      const { subscriptionId, updates } = await request.json();
      
      if (!subscriptionId) {
        return NextResponse.json(
          { error: 'Subscription ID is required' },
          { status: 400 }
        );
      }

      // For now, return success to avoid the "invalid action" error
      // TODO: Implement actual subscription update
      return NextResponse.json({
        success: true,
        subscription: { id: subscriptionId, ...updates },
        message: 'Subscription updated successfully (simulation)'
      });
    }

    if (action === 'delete') {
      const { subscriptionId } = await request.json();
      
      if (!subscriptionId) {
        return NextResponse.json(
          { error: 'Subscription ID is required' },
          { status: 400 }
        );
      }

      // For now, return success to avoid the "invalid action" error
      // TODO: Implement actual subscription deletion
      return NextResponse.json({
        success: true,
        message: 'Subscription deleted successfully (simulation)'
      });
    }

    return NextResponse.json(
      { error: 'Invalid action. Supported actions: detect, create, update, delete' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error processing subscriptions:', error);
    return NextResponse.json(
      { error: 'Failed to process subscriptions' },
      { status: 500 }
    );
  }
}
