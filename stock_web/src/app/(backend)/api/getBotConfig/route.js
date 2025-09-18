import { NextResponse } from 'next/server';
import { verifyToken } from '@/utils/tokenHandler';
import prisma from '@/utils/prismadb';

export async function GET(request) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get bot config for user
    const botConfig = await prisma.botConfig.findUnique({
      where: { userId: user.id },
      include: {
        symbols: true,
        entryConditions: true,
        exitConditions: true,
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
      entryCondition: botConfig.entryConditions.map(ec => ({
        left: ec.left,
        operator: ec.operator,
        right: ec.right,
        type: ec.type,
      })),
      exitCondition: botConfig.exitConditions.map(ec => ({
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
