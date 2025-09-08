// app/api/demat/route.js
import { breezeGet } from '@/app/(backend)/ICICI/services/CommonService';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Signed GET with empty body {}
    const data = await breezeGet('customerdetails', {});
    return NextResponse.json(data, { status: 200});
  } catch (err) {
    const error = err?.response?.data || { message: err?.message || 'Unknown error' };
    return NextResponse.json({ status: 500, message: 'Error', error });
  }
}
