import { Telegraf } from 'telegraf';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

if (!BOT_TOKEN) {
  throw new Error('TELEGRAM_BOT_TOKEN is not set');
}

const bot = new Telegraf(BOT_TOKEN);

// Helper function to parse duration
function parseDuration(input: string): number | null {
  const regex = /(\d+)([smhd смчд])/i;
  const match = regex.exec(input);
  if (!match) return null;

  const value = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();

  switch (unit) {
    case 's':
    case 'с':
      return value;
    case 'm':
    case 'м':
      return value * 60;
    case 'h':
    case 'ч':
      return value * 3600;
    case 'd':
    case 'д':
      return value * 86400;
    default:
      return null;
  }
}

const defaultPermissions = {
  can_send_messages: true,
  can_send_media_messages: true,
  can_send_audios: true,
  can_send_documents: true,
  can_send_photos: true,
  can_send_videos: true,
  can_send_video_notes: true,
  can_send_voice_notes: true,
  can_send_polls: true,
  can_send_other_messages: true,
  can_add_web_page_previews: true,
  can_change_info: true,
  can_invite_users: true,
  can_pin_messages: true,
  can_manage_topics: true
};

const onBreakPermissions = {
  can_send_messages: false,
  can_send_media_messages: false,
  can_send_audios: false,
  can_send_documents: false,
  can_send_photos: false,
  can_send_videos: false,
  can_send_video_notes: false,
  can_send_voice_notes: false,
  can_send_polls: false,
  can_send_other_messages: false,
  can_add_web_page_previews: false,
  can_change_info: false,
  can_invite_users: false,
  can_pin_messages: false,
  can_manage_topics: false
};

const breakPhrases = [
  'i need a break',
  'i need a pause',
  'мне нужна пауза',
  'мне нужен перерыв'
];

const breakRegex = new RegExp(`(${breakPhrases.join('|')}) (\\d+[smhdсмчд])`, 'i');

bot.hears(breakRegex, async (ctx) => {
  const durationInput = ctx.match?.[2];
  const durationSeconds = parseDuration(durationInput);

  if (durationSeconds === null) {
    await ctx.reply('Invalid duration format. Use s, m, h, or d (e.g., 10m for 10 minutes).');
    return;
  }

  // Get list of all members in the chat
  const chatId = ctx.chat?.id;
  const chat = await ctx.getChat();
  console.log('chat', chat)
  console.log('chat', Object.keys(ctx))
  if (!chatId) return;

  try {
    // Restrict all members from sending messages
    const members = await ctx.getChatMembersCount();

    console.log(members);

    await ctx.setChatPermissions(onBreakPermissions);

    ctx.reply(`Chat has been muted for ${durationInput} as requested by ${ctx.from?.first_name}.`);

    setTimeout(async () => {
      await ctx.setChatPermissions(defaultPermissions);

      ctx.reply('The break is over. You can now send messages.');
    }, durationSeconds * 1000);
  } catch (error) {
    console.error('Error restricting chat:', error);
    ctx.reply('Failed to restrict chat. Make sure I have the necessary permissions.');
  }
});

bot.launch();
