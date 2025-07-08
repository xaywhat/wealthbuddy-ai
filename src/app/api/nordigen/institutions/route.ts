import { NextRequest, NextResponse } from 'next/server';
import nordigenClient from '@/lib/nordigen';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const country = searchParams.get('country') || 'DK';

    const institutions = await nordigenClient.getInstitutions(country);

    // Filter for major Danish banks
    const danishBanks = institutions.filter((inst: any) => {
      const name = inst.name.toLowerCase();
      return (
        name.includes('danske') ||
        name.includes('nordea') ||
        name.includes('jyske') ||
        name.includes('sydbank') ||
        name.includes('arbejdernes') ||
        name.includes('landsbank')
      );
    });

    return NextResponse.json({
      success: true,
      institutions: danishBanks,
      all: institutions,
    });

  } catch (error) {
    console.error('Error fetching institutions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch institutions' },
      { status: 500 }
    );
  }
}
