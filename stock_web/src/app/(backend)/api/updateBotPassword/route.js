import { NextResponse } from 'next/server';
import { verifyToken } from '@/utils/tokenHandler';
import {getBotPassword, updateBotPassword } from '@/services/BotService';
import CryptoJS from 'crypto-js';
import * as yup from 'yup';

// Schema for validating password input
const passwordSchema = yup.object().shape({
  newPassword: yup.string().min(8).max(100).required('New password is required'),
  bot_id: yup.string().required('Bot ID is required'),
});

export async function POST(request) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    await passwordSchema.validate(body);

    const { oldPassword, newPassword } = body;

    // const response = await getBotPassword(user.id);
    // if (!response) {
    //   return NextResponse.json({ error: 'Password not found' }, { status: 404 });
    // }
    // // Verify old password
    // if (response.password !== CryptoJS.SHA256(oldPassword).toString()) {
    //   return NextResponse.json({ error: 'Old password is incorrect' }, { status: 400 });
    // }
    const newPasswordHash = CryptoJS.SHA256(newPassword).toString();

    const res = await updateBotPassword(body.bot_id, newPasswordHash);

    return NextResponse.json(
      { status:200, message: 'Password updated successfully', data: res },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error retrieving bot password:', error);
    return NextResponse.json({ status: 500, error: error.message }, { status: 500 });
  }
}
