import { NextResponse } from 'next/server';
import { verifyToken } from '@/utils/tokenHandler';
import { getBotResult } from '@/services/BotService';
import {formatDateTime} from '@/services/CommonService';
import * as yup from 'yup';

const botSchema = yup.object().shape({
  bot_id: yup.string().required('Bot ID is required'),
});


export async function POST(request) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    let body = await request.json();
    await botSchema.validate(body);
    const { bot_id } = body;
    // Get bot result from the database
    const response = await getBotResult(bot_id);
    if (response && response.execution_time) {
      response.execution_time = formatDateTime(response.execution_time);
    }

    if (!response) {
      return NextResponse.json({ error: 'Bot result not found' }, { status: 404 });
    }
    return NextResponse.json(
      { status:200, message: 'Bot result retrieved successfully', data: response },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error retrieving bot result:', error);
    return NextResponse.json({ status: 500, error: error.message }, { status: 500 });
  }
}
