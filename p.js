const express = require('express');
const cors = require('cors'); // Enable CORS
const { Telegraf, Markup } = require('telegraf');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// ----------------- FILE HANDLING -----------------
const usersFilePath = path.join(__dirname, 'users.json');
const redeemFilePath = path.join(__dirname, 'redeem.json');

function loadUsers() {
  try {
    if (fs.existsSync(usersFilePath)) {
      const data = fs.readFileSync(usersFilePath, 'utf8');
      return JSON.parse(data);
    } else {
      return [];
    }
  } catch (error) {
    console.error('Error reading users file:', error);
    return [];
  }
}

function saveUsers(users) {
  try {
    fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2));
  } catch (error) {
    console.error('Error writing users file:', error);
  }
}

function loadRedeemCodes() {
  try {
    if (fs.existsSync(redeemFilePath)) {
      const data = fs.readFileSync(redeemFilePath, 'utf8');
      return JSON.parse(data);
    } else {
      return { codes: [] };
    }
  } catch (error) {
    console.error('Error reading redeem file:', error);
    return { codes: [] };
  }
}

function saveRedeemCodes(redeemData) {
  try {
    fs.writeFileSync(redeemFilePath, JSON.stringify(redeemData, null, 2));
  } catch (error) {
    console.error('Error writing redeem file:', error);
  }
}

// ----------------- BOT HANDLERS REGISTRATION -----------------
function registerBotHandlers(bot) {
  // In-memory states for multi-step flows
  let userStates = {};
  let userInputs = {};
  let userLikesLog = {};

  // Lines to remove from API responses
  const linesToRemove = [
    'Info Admin - Group',
    'Admin',
    'Telegram',
    'Channel Telegram',
    'Group Zalo'
  ];

  function cleanApiResponse(response) {
    return response
      .split('\n')
      .filter(line => !linesToRemove.some(removable => line.includes(removable)))
      .join('\n');
  }

  function escapeMarkdownV2(text) {
    return text.replace(/([_*[\]()~`>#+\-=|{}\.!])/g, '\\$1');
  }

  async function fetchApiData(url) {
    try {
      const response = await axios.get(url, { responseType: 'text' });
      return response.data;
    } catch (error) {
      return 'Failed to fetch data. Please try again.';
    }
  }

  function getOrCreateUser(ctx) {
    const users = loadUsers();
    const telegramUser = ctx.message.from;
    let user = users.find(u => u.id === telegramUser.id);
    if (!user) {
      user = {
        id: telegramUser.id,
        first_name: telegramUser.first_name,
        last_name: telegramUser.last_name || '',
        username: telegramUser.username || '',
        balance: 0,
        lastBonus: 0
      };
      users.push(user);
      saveUsers(users);
    }
    return user;
  }

  function updateUserBalance(userId, newBalance) {
    const users = loadUsers();
    const index = users.findIndex(u => u.id === userId);
    if (index !== -1) {
      users[index].balance = newBalance;
      saveUsers(users);
    }
  }

  // Premium action costs
  const COSTS = {
    CHECK_INFO: 20,
    SEND_VISIT: 50,
    SEARCH_BY_NAME: 10,
    SPAM_FRIEND_REQUEST: 30
  };

  // ADMIN ID and channels (adjust as needed)
  const ADMIN_ID = 7479124922;
  const CHANNEL1 = '@freefirehacksantiban';
  const CHANNEL2 = 'https://t.me/+zRMhWLX04i1jNTU1';

  // Original checkJoin kept for information purposes.
  async function checkJoin(ctx) {
    try {
      const member = await ctx.telegram.getChatMember(CHANNEL1, ctx.from.id);
      if (member.status === 'left' || member.status === 'kicked') {
        await ctx.reply(`🚫 Please join all channels first: ${CHANNEL1}`, {
          reply_to_message_id: ctx.message?.message_id ?? ctx.callbackQuery?.message?.message_id
        });
        return false;
      }
      return true;
    } catch (e) {
      console.error(e);
      await ctx.reply("🚫 Error verifying membership. Please try again later.", {
        reply_to_message_id: ctx.message?.message_id ?? ctx.callbackQuery?.message?.message_id
      });
      return false;
    }
  }

  // Remove force join: simply call next without checking.
  async function requireJoin(ctx, next) {
    return next();
  }

  // ----------------- BOT COMMANDS AND HANDLERS -----------------
  bot.start(async (ctx) => {
    const users = loadUsers();
    const telegramUser = ctx.message.from;
    const referralId = ctx.startPayload;
    let user = users.find(u => u.id === telegramUser.id);
    if (!user) {
      user = {
        id: telegramUser.id,
        first_name: telegramUser.first_name,
        last_name: telegramUser.last_name || '',
        username: telegramUser.username || '',
        balance: 0,
        lastBonus: 0
      };
      users.push(user);
      if (referralId && referralId !== String(telegramUser.id)) {
        const refUser = users.find(u => String(u.id) === referralId);
        if (refUser) {
          refUser.balance += 50;
          saveUsers(users);
          ctx.reply(`You were referred by ${refUser.first_name}. They have earned 50 points!`, {
            reply_to_message_id: ctx.message.message_id
          });
        }
      }
      saveUsers(users);
    }
    const userName = telegramUser.first_name || 'User';
    const introMessage = `❤️HEY ${userName} !!\n\n𝐓𝐡𝐢𝐬 𝐢𝐬 𝐓𝐡𝐞 𝐅𝐢𝐫𝐬𝐭 𝐀𝐢🌐 𝐩𝐨𝐰𝐞𝐫𝐞𝐝 𝐓𝐞𝐥𝐞𝐠𝐫𝐚𝐦 𝐛𝐨𝐭 𝐅𝐨𝐫 𝐅𝐫𝐞𝐞 𝐅𝐢𝐫𝐞.\n𝐋𝐨𝐭𝐬 𝐨𝐟 𝐅𝐞𝐚𝐭𝐮𝐫𝐞𝐬 𝐲𝐨𝐮 𝐜𝐚𝐧 𝐚𝐜𝐜𝐞𝐬𝐬 𝐇𝐞𝐫𝐞🌋\n𝐎𝐖𝐍𝐄𝐑 @L1GENDFF.`;
    ctx.reply(introMessage, {
      reply_to_message_id: ctx.message.message_id,
      ...Markup.inlineKeyboard([
        [
          Markup.button.url("JOIN Channel 1", "https://t.me/freefirehacksantiban"),
          Markup.button.url("JOIN Channel 2", CHANNEL2)
        ],
        [Markup.button.callback("CONTINUE", "continue")]
      ])
    });
  });

  bot.action('continue', async (ctx) => {
    // Force join removed: simply respond without checking.
    await ctx.answerCbQuery();
    ctx.reply(
      'ᴡᴇʟᴄᴏᴍᴇ! ꜱᴇʟᴇᴄᴛ ᴀɴ ᴏᴘᴛɪᴏɴ ʙᴇʟᴏᴡ🇮🇳 (ꜰᴏʀ ɪɴᴅ ꜱᴇʀᴠᴇʀ ᴏɴʟʏ):',
      {
        reply_to_message_id: ctx.callbackQuery.message.message_id,
        ...Markup.keyboard([
          ['ℹ️ 𝑪𝑯𝑬𝑪𝑲 𝑰𝑵𝑭𝑶', '❤️ 𝐋𝐈𝐊𝐄𝐒'],
          ['👀 𝑺𝑬𝑵𝑫 𝑽𝑰𝑺𝑰𝑻', '🔍 𝗦𝗘𝗔𝗥𝗖𝗛 𝗕𝗬 𝗡𝗔𝗠𝗘'],
          ['🚫 𝑪𝑯𝑬𝑪𝑲 𝑩𝑨𝑵𝑵𝑬𝑫', '🤝 𝑺𝑷𝑨𝑴 𝑭𝑹𝑰𝑬𝑵𝑫 𝑹𝑬𝑸𝑼𝑬𝑺𝑻'],
          ['💰 𝑩𝑨𝑳𝑨𝑵𝑪𝑬', '🔗 𝑹𝑬𝑭𝑬𝑹𝑹𝑨𝑳'],
          ['👤 𝗢𝗪𝗡𝗘𝗥', '🎁 BONUS']
        ]).resize()
      }
    );
  });

  bot.hears('🎁 BONUS', requireJoin, (ctx) => {
    const user = getOrCreateUser(ctx);
    if (!user.lastBonus) user.lastBonus = 0;
    const now = Date.now();
    const ONE_DAY = 24 * 60 * 60 * 1000;
    const timeSinceLastBonus = now - user.lastBonus;
    if (timeSinceLastBonus >= ONE_DAY) {
      user.balance += 50;
      user.lastBonus = now;
      const users = loadUsers();
      const idx = users.findIndex(u => u.id === user.id);
      if (idx !== -1) {
        users[idx] = user;
        saveUsers(users);
      }
      return ctx.reply('🎉 You have received a +50 points bonus!', {
        reply_to_message_id: ctx.message.message_id
      });
    } else {
      const hoursLeft = Math.ceil((ONE_DAY - timeSinceLastBonus) / (1000 * 60 * 60));
      return ctx.reply(`❌ You have already claimed your bonus in the last 24 hours.\nCome back in ~${hoursLeft} hour(s).`, {
        reply_to_message_id: ctx.message.message_id
      });
    }
  });

  bot.hears(/^@everyone\s+(.+)/, async (ctx) => {
    if (ctx.from.id !== ADMIN_ID) return;
    const messageToSend = ctx.match[1];
    const users = loadUsers();
    for (const user of users) {
      try {
        await ctx.telegram.sendMessage(user.id, messageToSend);
      } catch (error) {
        console.error(`Failed to send message to ${user.id}`, error);
      }
    }
    ctx.reply("Broadcast sent to all users.", {
      reply_to_message_id: ctx.message.message_id
    });
  });

  // --------------- REDEEM SYSTEM ---------------
  bot.command('createcode', async (ctx) => {
    if (ctx.from.id !== ADMIN_ID) {
      return ctx.reply('❌ You are not authorized to create codes.', {
        reply_to_message_id: ctx.message.message_id
      });
    }
    const parts = ctx.message.text.split(' ');
    if (parts.length < 4) {
      return ctx.reply('Usage: /createcode [CODE] [SLOTS] [POINTS]', {
        reply_to_message_id: ctx.message.message_id
      });
    }
    const code = parts[1];
    const slots = parseInt(parts[2], 10);
    const points = parseInt(parts[3], 10);
    if (!code || isNaN(slots) || isNaN(points)) {
      return ctx.reply('Invalid arguments. Usage: /createcode [CODE] [SLOTS] [POINTS]', {
        reply_to_message_id: ctx.message.message_id
      });
    }
    const redeemData = loadRedeemCodes();
    const existing = redeemData.codes.find(c => c.code.toLowerCase() === code.toLowerCase());
    if (existing) {
      return ctx.reply(`❌ Code "${code}" already exists.`, {
        reply_to_message_id: ctx.message.message_id
      });
    }
    redeemData.codes.push({ code, slots, points, usedBy: [] });
    saveRedeemCodes(redeemData);
    ctx.reply(`✅ Code "${code}" created with ${slots} slots and ${points} points!`, {
      reply_to_message_id: ctx.message.message_id
    });
  });

  bot.command('redeem', async (ctx) => {
    if (!(await checkJoin(ctx))) return;
    const parts = ctx.message.text.split(' ');
    if (parts.length < 2) {
      return ctx.reply('Usage: /redeem [CODE]', {
        reply_to_message_id: ctx.message.message_id
      });
    }
    const code = parts[1];
    const users = loadUsers();
    const telegramUser = ctx.message.from;
    let user = users.find(u => u.id === telegramUser.id);
    const redeemData = loadRedeemCodes();
    const found = redeemData.codes.find(c => c.code.toLowerCase() === code.toLowerCase());
    if (!found) {
      return ctx.reply(`❌ Code "${code}" does not exist or is invalid.`, {
        reply_to_message_id: ctx.message.message_id
      });
    }
    if (found.usedBy.includes(user.id)) {
      return ctx.reply('❌ You have already redeemed this code.', {
        reply_to_message_id: ctx.message.message_id
      });
    }
    if (found.slots <= 0) {
      return ctx.reply('❌ This code is fully redeemed (no slots left).', {
        reply_to_message_id: ctx.message.message_id
      });
    }
    found.usedBy.push(user.id);
    found.slots -= 1;
    user.balance += found.points;
    const idx = users.findIndex(u => u.id === user.id);
    if (idx !== -1) {
      users[idx] = user;
      saveUsers(users);
    }
    saveRedeemCodes(redeemData);
    ctx.reply(`✅ You have redeemed code "${code}" and earned ${found.points} points!`, {
      reply_to_message_id: ctx.message.message_id
    });
  });

  // --------------- OTHER COMMANDS ---------------
  bot.command('users', (ctx) => {
    const users = loadUsers();
    const userCount = users.length;
    ctx.replyWithMarkdownV2(`🤖 Total users using this bot: *${userCount}*`, {
      reply_to_message_id: ctx.message.message_id
    });
  });

  bot.command('ai', async (ctx) => {
    const parts = ctx.message.text.split(' ');
    const question = parts.slice(1).join(' ');
    if (!question) {
      return ctx.reply('Please provide a question after the command. Example: /ai What is the meaning of life?', {
        reply_to_message_id: ctx.message.message_id
      });
    }
    ctx.reply('⏳ Processing your query....', {
      reply_to_message_id: ctx.message.message_id
    });
    const url = `https://deepseek.ytansh038.workers.dev/?question=${encodeURIComponent(question)}`;
    const apiResponse = await fetchApiData(url);
    let finalAnswer = apiResponse;
    try {
      const parsed = JSON.parse(apiResponse);
      if (parsed.status === 'success' && parsed.message) {
        finalAnswer = parsed.message;
      }
    } catch (err) { }
    const cleanedResponse = escapeMarkdownV2(cleanApiResponse(finalAnswer));
    ctx.replyWithMarkdownV2(`*AI Response:*\n\n${cleanedResponse}`, {
      reply_to_message_id: ctx.message.message_id
    });
  });

  // Commands requiring join check:
  bot.hears('ℹ️ 𝑪𝑯𝑬𝑪𝑲 𝑰𝑵𝑭𝑶', requireJoin, (ctx) => {
    const user = getOrCreateUser(ctx);
    if (user.balance < COSTS.CHECK_INFO) {
      return ctx.reply('❌ Not enough points to CHECK INFO. Earn points via referral or contact @L1GENDFF.', {
        reply_to_message_id: ctx.message.message_id
      });
    }
    user.balance -= COSTS.CHECK_INFO;
    updateUserBalance(user.id, user.balance);
    userStates[ctx.chat.id] = 'info';
    ctx.reply('Please enter your game ID:', {
      reply_to_message_id: ctx.message.message_id
    });
  });

  bot.hears('❤️ 𝐋𝐈𝐊𝐄𝐒', requireJoin, (ctx) => {
    userStates[ctx.chat.id] = 'likes';
    ctx.reply('Please enter your game ID to receive likes:', {
      reply_to_message_id: ctx.message.message_id
    });
  });

  bot.hears('👀 𝑺𝑬𝑵𝑺 𝑽𝑰𝑺𝑰𝑻', requireJoin, (ctx) => {
    const user = getOrCreateUser(ctx);
    if (user.balance < COSTS.SEND_VISIT) {
      return ctx.reply('❌ Not enough points to SEND VISIT. Earn points via referral or contact @L1GENDFF.', {
        reply_to_message_id: ctx.message.message_id
      });
    }
    user.balance -= COSTS.SEND_VISIT;
    updateUserBalance(user.id, user.balance);
    userStates[ctx.chat.id] = 'visit_uid';
    ctx.reply('Please enter your game ID to send visits:', {
      reply_to_message_id: ctx.message.message_id
    });
  });

  bot.hears('🔍 𝗦𝗘𝗔𝗥𝗖𝗛 𝗕𝗬 𝗡𝗔𝗠𝗘', requireJoin, (ctx) => {
    const user = getOrCreateUser(ctx);
    if (user.balance < COSTS.SEARCH_BY_NAME) {
      return ctx.reply('❌ Not enough points to SEARCH BY NAME.', {
        reply_to_message_id: ctx.message.message_id
      });
    }
    user.balance -= COSTS.SEARCH_BY_NAME;
    updateUserBalance(user.id, user.balance);
    userStates[ctx.chat.id] = 'search_name';
    ctx.reply('Please enter the name to search for:', {
      reply_to_message_id: ctx.message.message_id
    });
  });

  bot.hears('🚫 𝑪𝑯𝑬𝑪𝑲 𝑩𝑨𝑵𝑵𝑬𝑫', requireJoin, (ctx) => {
    userStates[ctx.chat.id] = 'banned';
    ctx.reply('Please enter your game ID to check banned status:', {
      reply_to_message_id: ctx.message.message_id
    });
  });

  bot.hears('🤝 𝑺𝑷𝑨𝑴 𝑭𝑹𝑰𝑬𝑵𝑫 𝑹𝑬𝑸𝑼𝑬𝑺𝑻', requireJoin, (ctx) => {
    const user = getOrCreateUser(ctx);
    if (user.balance < COSTS.SPAM_FRIEND_REQUEST) {
      return ctx.reply('❌ Not enough points to SPAM FRIEND REQUEST.', {
        reply_to_message_id: ctx.message.message_id
      });
    }
    user.balance -= COSTS.SPAM_FRIEND_REQUEST;
    updateUserBalance(user.id, user.balance);
    userStates[ctx.chat.id] = 'spam_friend';
    ctx.reply('Please enter your game ID to spam friend request:', {
      reply_to_message_id: ctx.message.message_id
    });
  });

  bot.hears('💰 𝑩𝑨𝑳𝑨𝑵𝑪𝑬', requireJoin, (ctx) => {
    const user = getOrCreateUser(ctx);
    ctx.reply(`Your current balance is: ${user.balance} points.`, {
      reply_to_message_id: ctx.message.message_id
    });
  });

  bot.hears('🔗 𝑹𝑬𝑭𝑬𝑹𝑹𝑨𝑳', requireJoin, (ctx) => {
    const user = getOrCreateUser(ctx);
    ctx.reply(
      `Share this link with new users:\nhttps://t.me/Legend_X_FF_BOT?start=${user.id}\n\nYou’ll earn 50 points if they start the bot using your link!`,
      { reply_to_message_id: ctx.message.message_id }
    );
  });

  bot.hears('👤 𝗢𝗪𝗡𝗘𝗥', requireJoin, (ctx) => {
    ctx.reply("Now you know who is behind it 💻", {
      reply_to_message_id: ctx.message.message_id,
      ...Markup.inlineKeyboard([
        [Markup.button.url("SEE", "http://t.me/Legend_X_FF_BOT/Legend_bot")]
      ])
    });
  });

  bot.on('text', async (ctx) => {
    const chatId = ctx.chat.id;
    const input = ctx.message.text.trim();
    const state = userStates[chatId];
    if (state === 'visit_uid') {
      if (!/^\d+$/.test(input)) {
        return ctx.reply('❌ Invalid UID. Please enter numbers only.', {
          reply_to_message_id: ctx.message.message_id
        });
      }
      userInputs[chatId] = { uid: input };
      userStates[chatId] = 'visit_count';
      return ctx.reply('✅ Now enter the number of visits you want to send:', {
        reply_to_message_id: ctx.message.message_id
      });
    }
    if (state === 'visit_count') {
      if (!/^\d+$/.test(input) || parseInt(input) < 1) {
        return ctx.reply('❌ Invalid count. Please enter a positive number.', {
          reply_to_message_id: ctx.message.message_id
        });
      }
      const { uid } = userInputs[chatId];
      const url = `https://freefire-virusteam.vercel.app/ind/visit?key=7day@apivirusteam&uid=${uid}&sl=${input}`;
      ctx.reply('⏳ Connecting to server...', { reply_to_message_id: ctx.message.message_id });
      const rawData = await fetchApiData(url);
      ctx.replyWithMarkdownV2(
        `✅ *Visits Sent Successfully\\!*\\n\\n📄 *RAW DATA:*\\n\`\`\`\n${rawData}\n\`\`\``,
        { reply_to_message_id: ctx.message.message_id }
      );
      delete userStates[chatId];
      delete userInputs[chatId];
      return;
    }
    let url;
    let messagePrefix = '';
    if (state === 'info') {
      if (!/^\d+$/.test(input)) {
        return ctx.reply('❌ Invalid UID. Please enter numbers only.', { reply_to_message_id: ctx.message.message_id });
      }
      url = `https://freefire-virusteam.vercel.app/ind/info?uid=${input}`;
      messagePrefix = '*User Info:*\n\n';
    }
    else if (state === 'likes') {
      if (!/^\d+$/.test(input)) {
        return ctx.reply('❌ Invalid UID. Please enter numbers only.', { reply_to_message_id: ctx.message.message_id });
      }
      if (userLikesLog[input]) {
        return ctx.reply('❌ YOU ARE DONE FOR TODAY, TRY TOMORROW.', { reply_to_message_id: ctx.message.message_id });
      }
      userLikesLog[input] = true;
      url = `https://freefire-virusteam.vercel.app/ind/likes?key=7day@apivirusteam&uid=${input}`;
      messagePrefix = '✅ *Likes Sent Successfully\\!*\\n\\n';
    }
    else if (state === 'search_name') {
      url = `https://freefire-virusteam.vercel.app/ind/search?key=7day@apivirusteam&name=${encodeURIComponent(input)}`;
      messagePrefix = '🔍 *Search Results:*\n\n';
    }
    else if (state === 'banned') {
      if (!/^\d+$/.test(input)) {
        return ctx.reply('❌ Invalid UID. Please enter numbers only.', { reply_to_message_id: ctx.message.message_id });
      }
      url = `https://freefire-virusteam.vercel.app/ind/isbanned?uid=${input}`;
      messagePrefix = '*Banned Check:*\n\n';
    }
    else if (state === 'spam_friend') {
      if (!/^\d+$/.test(input)) {
        return ctx.reply('❌ Invalid UID. Please enter numbers only.', { reply_to_message_id: ctx.message.message_id });
      }
      url = `https://freefire-virusteam.vercel.app/ind/spamkb?key=7day@apivirusteam&uid=${input}`;
      messagePrefix = '✅ *Spam Friend Request Sent Successfully\\!*\\n\\n';
    }
    else {
      return;
    }
    ctx.reply('⏳ Connecting to server...', { reply_to_message_id: ctx.message.message_id });
    const apiResponse = await fetchApiData(url);
    const cleanedResponse = escapeMarkdownV2(cleanApiResponse(apiResponse));
    if (state === 'likes') {
      ctx.replyWithMarkdownV2(
        messagePrefix + cleanedResponse + '\\n\\n📢 *If you want likes in bulk, contact @L1GENDFF*',
        { reply_to_message_id: ctx.message.message_id }
      );
    } else {
      ctx.replyWithMarkdownV2(messagePrefix + cleanedResponse, { reply_to_message_id: ctx.message.message_id });
    }
    delete userStates[chatId];
  });

  bot.launch();
  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
}

// ----------------- EXPRESS SERVER -----------------
const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for all origins so that external front‑ends can access the API.
app.use(cors());

// Object to store bot instances by token.
const bots = {};

// Public endpoint – no authentication required.
// To use, simply call: /api?token=YOUR_TELEGRAM_BOT_TOKEN
app.get('/api', (req, res) => {
  const token = req.query.token;
  if (!token) {
    return res.status(400).json({ error: 'Please provide your Telegram bot token as ?token=YOUR_TOKEN' });
  }
  // If bot for this token doesn't exist, create and register handlers.
  if (!bots[token]) {
    try {
      const bot = new Telegraf(token);
      registerBotHandlers(bot);
      bots[token] = bot;
      console.log(`Bot started for token: ${token}`);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to start bot with provided token.' });
    }
  }
  res.json({ status: 'Bot is running', token });
});

app.listen(PORT, () => {
  console.log(`API server is running on port ${PORT}`);
});
