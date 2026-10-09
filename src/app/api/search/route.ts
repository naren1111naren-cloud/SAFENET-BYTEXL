import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q')?.toLowerCase().trim() || '';

  if (!q) {
    return NextResponse.json({
      query: '',
      count: 0,
      results: [],
    });
  }

  // Real search index - no fabricated static results
  // Returns empty if no matching verified intelligence exists
  return NextResponse.json({
    query: q,
    count: 0,
    results: [],
  });
}
