// services/BotService.js

import prisma from "@/utils/prismadb";

export async function updateBotConfig(userId, data) {
  // You can expand Prisma model in schema.prisma as needed
  // Assume: botConfig, botSymbol, entryCondition, exitCondition models
    
  // Upsert core bot config
  const botConfig = await prisma.botConfig.upsert({
    where: { userId },
    update: {
      sessionToken: data.sessionToken,
      capitalPerStock: data.capitalPerStock,
      isLive: data.isLive,
      interval: data.interval,
      user: data.sessionUser
    },
    create: {
      userId,
      sessionToken: data.sessionToken,
      capitalPerStock: data.capitalPerStock,
      isLive: data.isLive,
      interval: data.interval,
      user: data.sessionUser
    }
  });

  // Clear and re-insert symbols
  await prisma.Symbol.deleteMany({ where: { botConfigId: botConfig.id } });
  if (Array.isArray(data.symbols)) {
    await prisma.Symbol.createMany({
      data: data.symbols.map(symbol => ({
        name: symbol,
        botConfigId: botConfig.id,
      })),
    });
  }

  // Clear and re-insert entry conditions
  await prisma.entryCondition.deleteMany({ where: { botConfigId: botConfig.id } });
  if (Array.isArray(data.entryCondition)) {
    await prisma.entryCondition.createMany({
      data: data.entryCondition.map(cond => ({
        left: cond.left,
        operator: cond.operator,
        right: cond.right,
        type: cond.type,
        botConfigId: botConfig.id,
      })),
    });
  }

  // Clear and re-insert exit conditions
  await prisma.exitCondition.deleteMany({ where: { botConfigId: botConfig.id } });
  if (Array.isArray(data.exitCondition)) {
    await prisma.exitCondition.createMany({
      data: data.exitCondition.map(cond => ({
        left: cond.left,
        operator: cond.operator,
        right: cond.right,
        type: cond.type,
        botConfigId: botConfig.id,
      })),
    });
  }

  return botConfig;
}

export async function getBotPassword(user_id) {
  try {
    // Get password hash from bot_passwords table or users table
    const passwordRecord = await prisma.bots.findUnique({
      where: { user_id },
      select: { password: true }
    });

    return passwordRecord.password;

  } catch (error) {
    console.error('Error fetching bot password:', error);
    throw new Error('Failed to retrieve password');
  }
}


export async function setBotPassword(user_id, password, name, bot_config_id) {
  try {
    // Upsert password hash for the user
    const passwordRecord = await prisma.bots.upsert({
      where: { user_id },
      update: { password },
      create: { user_id, password, name, bot_config_id }
    });

    return passwordRecord;
  } catch (error) {
    console.error('Error setting bot password:', error);
    throw new Error('Failed to set password');
  }
}

