import { NextResponse } from 'next/server';
import { verifyToken } from '@/utils/tokenHandler';
import { getBotPassword, setBotPassword } from '@/services/BotService';
import CryptoJS from 'crypto-js';


export async function GET(request) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get bot password hash from the database
    const passwordHash = await getBotPassword(user.id);

    // const newPassword = "Swadesh@909090";
    // const passwordHash = CryptoJS.SHA256(newPassword).toString();

    // await setBotPassword(user.id, passwordHash, 'RSI WealthBot', 1);

    if (!passwordHash) {
      return NextResponse.json({ error: 'Password not found' }, { status: 404 });
    }

    return NextResponse.json(
      { message: 'Password hash retrieved successfully', passwordHash },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error retrieving bot password:', error);
    return NextResponse.json({ status: 500, error: error.message }, { status: 500 });
  }
}
