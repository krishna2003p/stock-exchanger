import { NextResponse } from 'next/server';
import { verifyToken } from '@/utils/tokenHandler';
import { getBotPassword } from '@/services/BotService';


export async function GET(request) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get bot password hash from the database
    const response = await getBotPassword(user.id);

    if (!response) {
      return NextResponse.json({ error: 'Password not found' }, { status: 404 });
    }
    return NextResponse.json(
      { status:200, message: 'Password hash retrieved successfully', data: response },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error retrieving bot password:', error);
    return NextResponse.json({ status: 500, error: error.message }, { status: 500 });
  }
}
