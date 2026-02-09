/**
 * API Route: /api/affiliate/logout
 * Clear affiliate session
 */

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete('affiliate_token');
  
  return NextResponse.json({ success: true });
}
