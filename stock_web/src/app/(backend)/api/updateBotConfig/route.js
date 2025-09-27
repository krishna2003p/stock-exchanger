import { NextResponse } from 'next/server';
import { verifyToken } from '@/utils/tokenHandler';
import { updateBotConfig } from '@/services/BotService';
import * as yup from 'yup';

// You can define your schema similar to userSchema but for your bot config
const botSchema = yup.object().shape({
  id: yup.string().required('Bot ID is required'),
  sessionToken: yup.string().required(),
  sessionUser: yup.string().required(),
  capitalPerStock: yup.number().required(),
  isLive: yup.boolean().required(),
  interval: yup.string().required(),
  symbols: yup.array().of(yup.string()).required(),
  entryCondition: yup.array().of(
    yup.object().shape({
      left: yup.string().required(),
      operator: yup.string().required(),
      right: yup.string().required(),
      type: yup.string().required(),
    })
  ).required(),
  exitCondition: yup.array().of(
    yup.object().shape({
      left: yup.string().required(),
      operator: yup.string().required(),
      right: yup.string().required(),
      type: yup.string().required(),
    })
  ).required(),
});

export async function POST(request) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    await botSchema.validate(body);

    // Update bot config in the database
    const updatedBot = await updateBotConfig(user.id, body);

    return NextResponse.json(
      { message: 'Bot config updated successfully', bot: updatedBot },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating bot config:', error);
    return NextResponse.json({ status: 500, error: error.message }, { status: 500 });
  }
}
