// app/api/signOut/route.js
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
    const cookieStore = await cookies();
  cookieStore.delete('token');     // deletes for the current domain/path scope
  return NextResponse.json({ ok: true });
}
