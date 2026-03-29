const TelegramBot = require('node-telegram-bot-api');
const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
if (!TOKEN) { console.error('Error: TELEGRAM_BOT_TOKEN env var required'); process.exit(1); }
const bot = new TelegramBot(TOKEN, { polling: true });
console.log('🛡️ Scam Shield started');

const analyze = (text) => {
  const patterns = {
    urgency: [/urgent/i, /immediate/i, /act now/i, /limited time/i, /expir/i, /last chance/i],
    financial: [/guaranteed/i, /risk.?free/i, /double your/i, /wire transfer/i, /gift card/i],
    authority: [/irs/i, /fbi/i, /suspended/i, /verify your/i, /unauthorized/i],
    romance: [/love you/i, /miss you/i, /need money/i, /stranded/i],
    crypto: [/send.*(bitcoin|btc|eth)/i, /wallet/i, /seed phrase/i, /connect your wallet/i],
    phishing: [/click (here|below)/i, /verify now/i, /update your password/i],
    social: [/don.t tell/i, /keep secret/i, /trust me/i, /not a scam/i]
  };
  const known = ['you have won', 'claim your prize', 'nigerian prince', 'kindly send', 'dear beneficiary'];
  
  let score = 0, flags = [];
  for (const [cat, pats] of Object.entries(patterns)) {
    for (const p of pats) { if (p.test(text)) { flags.push(cat); score += 10; } }
  }
  for (const s of known) { if (text.toLowerCase().includes(s)) { flags.push('known_scam'); score += 20; } }
  if (/(?:bit\.ly|tinyurl|t\.co)/i.test(text)) { flags.push('shortened_url'); score += 15; }
  
  score = Math.min(score, 100);
  let cat = '✅ CLEAN';
  if (score >= 70) cat = '🚨 HIGH RISK';
  else if (score >= 40) cat = '⚠️ SUSPICIOUS';
  else if (score >= 15) cat = '⚡ LOW RISK';
  
  let r = '🛡️ Analysis\n\nRisk: ' + score + '/100\nCategory: ' + cat + '\n\n';
  if (flags.length > 0) r += 'Flags: ' + [...new Set(flags)].join(', ') + '\n\n';
  if (score >= 70) r += '🚨 DO NOT ENGAGE. Block and report.';
  else if (score >= 40) r += '⚠️ Proceed with caution.';
  else if (score >= 15) r += '⚡ Minor indicators.';
  else r += '✅ Looks clean.';
  return r;
};

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id,
    '🛡️ Scam Shield\n\nPaste any suspicious message, link, or crypto address. I will analyze it.\n\n/check [text] - Analyze\n/url [link] - Check URL\n/crypto [address] - Check address\n/help - Commands\n\n🧪 Free while in beta!'
  );
});

bot.onText(/\/help/, (msg) => {
  bot.sendMessage(msg.chat.id, '🛡️ Commands\n\n/check [text] - Analyze message\n/url [link] - Check URL\n/crypto [address] - Check crypto\n\nOr just paste any suspicious text!');
});

bot.onText(/\/check (.+)/, (msg, match) => bot.sendMessage(msg.chat.id, analyze(match[1])));

bot.onText(/\/url (.+)/, (msg, match) => {
  const url = match[1];
  let risk = 'LOW', details = [];
  if (/\.(xyz|top|buzz|club|tk)\//i.test(url)) { risk = 'HIGH'; details.push('Suspicious TLD'); }
  if (/login|verify|account/i.test(url)) { risk = 'MEDIUM'; details.push('Phishing keywords'); }
  bot.sendMessage(msg.chat.id, '🛡️ URL Check\n\nURL: ' + url + '\nRisk: ' + risk + '\n\n' + (details.length ? details.map(d => '⚠️ ' + d).join('\n') : '✅ No red flags'));
});

bot.onText(/\/crypto (.+)/, (msg, match) => {
  const addr = match[1];
  let r = '🛡️ Crypto Check\n\nAddress: ' + addr.slice(0, 20) + '...\n\n';
  if (addr.includes('000000000000000000000000000000000000dead') || addr.includes('0000000000000000000000000000000000000000')) {
    r += '🚨 BURN ADDRESS - Do not send!';
  } else if (/^0x[0-9a-fA-F]{40}$/.test(addr)) {
    r += '✅ Valid Ethereum format\n⚠️ Verify before sending';
  } else {
    r += '❓ Unknown format';
  }
  bot.sendMessage(msg.chat.id, r);
});

bot.on('message', (msg) => {
  if (!msg.text || msg.text.startsWith('/')) return;
  if (msg.text.length > 10) bot.sendMessage(msg.chat.id, analyze(msg.text));
});
