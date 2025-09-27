import { NextResponse } from 'next/server';
import { verifyToken } from '@/utils/tokenHandler';
import prisma from '@/utils/prismadb';
import * as yup from 'yup';

// Define schema for validation
const botSchema = yup.object().shape({
  id: yup.string().required('Bot ID is required'),
});

export async function POST(request) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate request body against schema
    const requestBody = await request.json();
    console.log("Request Body:", requestBody);
    await botSchema.validate(requestBody);
    const { id } = requestBody;

    // Get bot config for user
    const botConfig = await prisma.bot_config.findUnique({
      where: { bot_id: id },
      include: {
        symbols: true,
        entry_condition: true,
        exit_condition: true,
      }
    });

    if (!botConfig) {
      return NextResponse.json({ error: 'Configuration not found' }, { status: 404 });
    }

    // Format response in same structure as updateBot payload
    const responsePayload = {
      sessionToken: botConfig.sessionToken,
      userId: botConfig.userId,
      sessionUser: botConfig.user,
      capitalPerStock: botConfig.capitalPerStock,
      isLive: botConfig.isLive,
      interval: botConfig.interval,
      symbols: botConfig.symbols.map(s => s.name),
      entryCondition: botConfig.entry_condition.map(ec => ({
        left: ec.left,
        operator: ec.operator,
        right: ec.right,
        type: ec.type,
      })),
      exitCondition: botConfig.exit_condition.map(ec => ({
        left: ec.left,
        operator: ec.operator,
        right: ec.right,
        type: ec.type,
      })),
    };

    return NextResponse.json(responsePayload, { status: 200 });

  } catch (error) {
    console.error('Error fetching bot config:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
