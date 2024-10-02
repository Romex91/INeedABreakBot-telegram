"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const telegraf_1 = require("telegraf");
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
if (!BOT_TOKEN) {
    throw new Error('TELEGRAM_BOT_TOKEN is not set');
}
const bot = new telegraf_1.Telegraf(BOT_TOKEN);
// Helper function to parse duration
function parseDuration(input) {
    const regex = /(\d+)\s*([smhd смчд])/i;
    const match = regex.exec(input);
    if (!match)
        return null;
    const value = parseInt(match[1], 10);
    const unit = match[2].toLowerCase().trim();
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
    'let\'s take a break',
    'time for a break',
    'break time',
    'pause please',
    'can we pause',
    'мне нужна пауза',
    'мне нужен перерыв',
    'давайте сделаем перерыв',
    'время для перерыва',
    'перерыв',
    'пауза',
    'паузу',
    'пауза пожалуйста',
];
const breakRegex = new RegExp(`(${breakPhrases.join('|')})( (\\d+\\s*[smhdсмчд]))?`, 'i');
// Add this after the breakRegex definition and before the bot.hears(breakRegex, ...) handler
bot.command('help', (ctx) => {
    const helpMessage = `
*Usage Examples:*

"I need a break 10m"
"Let's take a break 1 h"
"Мне нужен перерыв 30 м"
"Давайте сделаем перерыв 2ч"

*Supported phrases:*
${breakPhrases.join('\n')}

*Duration units:* s/с (seconds), m/м (minutes), h/ч (hours), d/д (days)
Max duration: 4 days
You can use spaces between the number and unit (e.g., "1 m" or "2 h")
`;
    ctx.replyWithMarkdown(helpMessage);
});
bot.hears(breakRegex, async (ctx) => {
    var _a, _b;
    const durationInput = (_a = ctx.match) === null || _a === void 0 ? void 0 : _a[3];
    if (!durationInput) {
        await ctx.reply('To initiate a break specify a duration. Use s/с, m/м, h/ч, or d/д (e.g., "I need a break 10m" or "Мне нужен перерыв 10м" for 10 minutes).');
        return;
    }
    const durationSeconds = parseDuration(durationInput);
    if (durationSeconds === null) {
        await ctx.reply('Invalid duration format. Use s, m, h, or d (e.g., 10m for 10 minutes).');
        return;
    }
    // Check if duration is longer than 4 days
    if (durationSeconds > 4 * 86400) {
        await ctx.reply('Гаф! I apologize, but breaks longer than 4 are not supported to avoid permabans by mistake. Please specify a shorter duration.');
        return;
    }
    // Get list of all members in the chat
    const chatId = (_b = ctx.chat) === null || _b === void 0 ? void 0 : _b.id;
    const chat = await ctx.getChat();
    console.log('chat', chat);
    console.log('chat', Object.keys(ctx));
    if (!chatId)
        return;
    try {
        // Restrict all members from sending messages
        const members = await ctx.getChatMembersCount();
        console.log(members);
        await ctx.setChatPermissions(onBreakPermissions);
        ctx.reply(`Гаф Гаф! Группа всё, можете отдыхать!\nChat has been muted for ${durationInput}.`);
        setTimeout(async () => {
            await ctx.setChatPermissions(defaultPermissions);
            ctx.reply('The break is over. You can now send messages.');
        }, durationSeconds * 1000);
    }
    catch (error) {
        console.error('Error restricting chat:', error);
        ctx.reply('Failed to restrict chat. Make sure I have the necessary permissions.');
    }
});
bot.launch();
