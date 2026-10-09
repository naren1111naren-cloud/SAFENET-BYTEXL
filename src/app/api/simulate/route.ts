import { NextRequest, NextResponse } from 'next/server';
import { generateAttackScenarios } from '@/lib/simulator/attack-simulator';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      brandName = 'Paytm',
      brandDomain = 'paytm.com',
      count = 8,
    } = body;

    if (!brandName || !brandDomain) {
      return NextResponse.json(
        { error: 'Brand name and domain are required for threat simulation.' },
        { status: 400 }
      );
    }

    const { result, isLLMPowered } = await generateAttackScenarios(
      brandName.trim(),
      brandDomain.trim(),
      Number(count) || 8
    );

    return NextResponse.json({
      ...result,
      isLLMPowered,
    });
  } catch (error: any) {
    console.error('Error generating attack simulation:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to simulate brand attack scenarios.' },
      { status: 500 }
    );
  }
}
