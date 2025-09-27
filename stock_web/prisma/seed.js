// const { PrismaClient } = require('@prisma/client');
// const prisma = new PrismaClient();
import prisma from '@/utils/prismadb';

async function main() {
  // users
//   const user = await prisma.users.create({
//     data: {
//       name: "Swadesh Kumar Yadav",
//       username: "swadeshhuf",
//       email: "swadesh@example.com",
//       mobile: "9876543210",
//       password: "909090",
//       role: "Admin",
//       vendor: "ICICI",
//       profile_img: "profile.png",
//       location: "Faridabad, India",
//       bio: "I am a passionate trader, always looking for new opportunities.",
//       company: "Stock Exchanger",
//       website: "https://stockexchanger.com",
//     }
//   });

//   // users_token
//   await prisma.users_token.create({
//     data: {
//       user_id: user.id,
//       token: "sometokenstring",
//     }
//   });

//   // users_social_details
//   await prisma.users_social_details.create({
//     data: {
//       user_id: user.id,
//       facebook: "fbuser",
//       instagram: "instauser",
//       github: "githubuser",
//       twitter: "twitteruser",
//       linkedin: "linkedinuser",
//       telegram: "telegramuser",
//     }
//   });

//   // vendors
//   await prisma.vendors.create({
//     data: {
//       user_id: user.id,
//       vendor_name: "Demo Vendor",
//       app_key: "appkey",
//       secret_key: "secretkey",
//       session_key: "sessionkey",
//       session_token: "sessiontoken",
//     }
//   });

//   // bots
//   const bot = await prisma.bots.create({
//     data: {
//       user_id: user.id,
//       name: "Mean Reversion Bot",
//       bot_img: "botimg.png",
//       password: "supersecret",
//       status: "Active",
//       price: 100,
//       returns: 10,
//       risk: 5,
//       intro: "This is a sample bot.",
//     }
//   });

  // bot_result
  await prisma.bot_result.create({
    data: {
      bot_id: 1,
      execution_time: new Date(),
      symbols_processed: 3,
      current_holdings: 2,
      current_orders: 1,
      buy_orders: 0,
      sell_orders: 1,
      total_buy_value: 10000,
      total_sell_value: 15000,
      net_flow: 5000,
      is_live: 0,
      capital_per_stock: 5000,
      status: "Executed",
    }
  });

  // bot_config and relations
  const botConfig = await prisma.bot_config.create({
    data: {
      bot_id: 1,
      user: "SWADESHHUF",
      sessionToken: "53149300",
      capitalPerStock: 50000,
      isLive: false,
      interval: "5minute",
    }
  });

  // entry_condition
  await prisma.entry_condition.createMany({
    data: [
      {
        left: "RSI_D",
        operator: ">",
        right: "58",
        type: "number",
        botConfigId: botConfig.id,
      },
      {
        left: "RSI_W",
        operator: ">",
        right: "58",
        type: "number",
        botConfigId: botConfig.id,
      },
      {
        left: "RSI_M",
        operator: ">",
        right: "58",
        type: "number",
        botConfigId: botConfig.id,
      },
      {
        left: "open",
        operator: ">",
        right: "EMA_100_D",
        type: "field",
        botConfigId: botConfig.id,
      },
      {
        left: "open",
        operator: ">",
        right: "EMA_200_W",
        type: "field",
        botConfigId: botConfig.id,
      },
      {
        left: "open",
        operator: ">",
        right: "EMA_50_M",
        type: "field",
        botConfigId: botConfig.id,
      },
      {
        left: "EMA_100_D",
        operator: ">",
        right: "EMA_200_D",
        type: "field",
        botConfigId: botConfig.id,
      },
      {
        left: "EMA_200_D",
        operator: ">",
        right: "EMA_200_W",
        type: "field",
        botConfigId: botConfig.id,
      },
      {
        left: "EMA_200_W",
        operator: ">",
        right: "EMA_50_M",
        type: "field",
        botConfigId: botConfig.id,
      }
    ]
  });

  // exit_condition
  await prisma.exit_condition.createMany({
    data: [
      {
        left: "close",
        operator: "<",
        right: "EMA_200_D",
        type: "field",
        botConfigId: botConfig.id,
      },
      {
      left: "RSI_W",
      operator: "<",
      right: "40",
      type: "number",
      botConfigId: botConfig.id,
    }
    ]
  });

  // symbols
  await prisma.symbols.createMany({
    data: [
      { name: "AADHOS", botConfigId: botConfig.id },
      { name: "AARIND", botConfigId: botConfig.id },
      { name: "ABB", botConfigId: botConfig.id },
      { name: "ABBPOW", botConfigId: botConfig.id },
      { name: "ACMSOL", botConfigId: botConfig.id },
      { name: "ACTCON", botConfigId: botConfig.id },
      { name: "ADATRA", botConfigId: botConfig.id },
      { name: "ADAWIL", botConfigId: botConfig.id },
      { name: "ADIAMC", botConfigId: botConfig.id },
      { name: "AEGLOG", botConfigId: botConfig.id },
      { name: "AFCINF", botConfigId: botConfig.id },
      { name: "AJAPHA", botConfigId: botConfig.id },
      { name: "AKUDRU", botConfigId: botConfig.id },
      { name: "ALKAMI", botConfigId: botConfig.id },
      { name: "ALSTD", botConfigId: botConfig.id },
      { name: "AMARAJ", botConfigId: botConfig.id },
      { name: "AMBCE", botConfigId: botConfig.id },
      { name: "AMIORG", botConfigId: botConfig.id },
      { name: "ANARAT", botConfigId: botConfig.id },
      { name: "APAIND", botConfigId: botConfig.id },
      { name: "APLAPO", botConfigId: botConfig.id },
      { name: "ZOMLIM", botConfigId: botConfig.id },
      { name: "ASTPOL", botConfigId: botConfig.id },
      { name: "ATUL", botConfigId: botConfig.id },
      { name: "BAJHOU", botConfigId: botConfig.id },
      { name: "BANBAN", botConfigId: botConfig.id },
      { name: "BASF", botConfigId: botConfig.id },
      { name: "BHAELE", botConfigId: botConfig.id },
      { name: "BHAFOR", botConfigId: botConfig.id },
      { name: "BHAHEX", botConfigId: botConfig.id },
      { name: "BIKFOO", botConfigId: botConfig.id },
      { name: "BIRCOR", botConfigId: botConfig.id },
      { name: "BRASOL", botConfigId: botConfig.id },
      { name: "BRIENT", botConfigId: botConfig.id },
      { name: "BSE", botConfigId: botConfig.id },
      { name: "CADHEA", botConfigId: botConfig.id },
    ]
  });

  console.log('Seed completed!');
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
