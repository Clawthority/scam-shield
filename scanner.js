#!/usr/bin/env node
/**
 * Scam Shield — Multi-surface scam detection engine
 * Analyzes messages, links, phone numbers, and crypto addresses
 * for scam indicators using pattern matching and behavioral analysis
 */

const https = require('https');
const fs = require('fs');

// --- HTTP helper ---
function httpReq(url) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const req = https.request({
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      headers: { 'User-Agent': 'ScamShield/1.0' },
      timeout: 15000
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
    req.end();
  });
}

// --- Scam Pattern Database ---
const SCAM_PATTERNS = {
  // Urgency/fear tactics
  urgency: [
    /urgent(ly)?/i, /immediate(ly)?/i, /act now/i, /limited time/i,
    /expir(es?|ing)/i, /last chance/i, /don't (miss|delay)/i,
    /within \d+ (hours?|minutes?|days?)/i, /right away/i,
    /before it's (too )?late/i
  ],

  // Financial manipulation
  financial: [
    /guaranteed (returns?|profit|income)/i, /risk.?free/i,
    /double your (money|investment)/i, /earn \$?\d+/i,
    /passive income/i, /make money (fast|online|from home)/i,
    /crypto (profit|gain|return)/i, /investment opportunity/i,
    /wire (transfer|money)/i, /send (money|funds|bitcoin|crypto)/i,
    /gift card/i, /prepaid (card|debit)/i, /western union/i,
    /money gram/i, /cash.?app/i, /zelle/i
  ],

  // Authority impersonation
  authority: [
    /irs/i, /tax (office|department|refund)/i, /social security/i,
    /fbi/i, /police/i, /arrest warrant/i, /legal action/i,
    /suspended account/i, /verify your (identity|account)/i,
    /amazon (support|security)/i, /apple (support|security)/i,
    /microsoft (support|security)/i, /bank (security|fraud)/i,
    /paypal (security|dispute)/i, /your account (has been|is)/i,
    /unauthorized (access|transaction)/i
  ],

  // Romance/emotional manipulation
  romance: [
    /love you/i, /miss you/i, /soulmate/i, /destiny/i,
    /can't stop thinking/i, /only one for me/i, /meant to be/i,
    /need (money|help|funds) (for|to)/i, /emergency.*need/i,
    /stranded/i, /hospital/i, /sick (relative|family)/i
  ],

  // Crypto-specific
  crypto: [
    /send.*bitcoin|btc|eth|crypto|wallet/i,
    /wallet address/i, /seed phrase/i, /private key/i,
    /double your (btc|eth|crypto)/i, /airdrop (claim|reward)/i,
    /connect your wallet/i, /approve (transaction|contract)/i,
    /free (crypto|tokens|nft)/i, /mining (reward|profit)/i,
    /presale|pre-sale/i, /whitelist (spot|access)/i
  ],

  // Phishing indicators
  phishing: [
    /click (here|this link|below)/i, /verify (now|here)/i,
    /login (here|now)/i, /update your (password|info|account)/i,
    /confirm your (identity|email|phone)/i, /suspicious (activity|login)/i,
    /unusual (activity|sign.?in)/i, /we('ve| have) detected/i
  ],

  // Social engineering
  social: [
    /don't tell (anyone|your family|others)/i, /keep (this|it) (secret|private)/i,
    /between us/i, /trust me/i, /i('m| am) (legit|real|not a scam)/i,
    /not a scam/i, /100% (legit|safe|guaranteed)/i,
    /act (fast|quickly|now) before/i
  ]
};

// --- Known Scam Indicators ---
const KNOWN_SCAM_URLS = [
  /\.(xyz|top|buzz|club|work|gq|ml|tk|cf|ga)\//i, // Suspicious TLDs
  /secure.*login.*verify/i, /account.*update.*confirm/i,
  /amazon.*signin.*verify/i, /apple.*id.*unlock/i
];

// Trusted legitimate domains that should never trigger HIGH risk
const TRUSTED_DOMAINS = [
  'google.com', 'google.co.uk', 'google.ca', 'google.com.au',
  'apple.com', 'icloud.com', 'appleid.apple.com',
  'amazon.com', 'amazon.co.uk', 'amazonservices.com',
  'microsoft.com', 'microsoftonline.com', 'live.com', 'outlook.com',
  'facebook.com', 'instagram.com', 'whatsapp.com', 'meta.com',
  'twitter.com', 'x.com',
  'linkedin.com', 'github.com', 'gitlab.com', 'bitbucket.org',
  'netflix.com', 'spotify.com', 'youtube.com',
  'paypal.com', 'venmo.com', 'cashapp.com', 'zelle.com',
  'chase.com', 'bankofamerica.com', 'wellsfargo.com', 'citi.com', 'usbank.com',
  'fedex.com', 'ups.com', 'usps.com', 'dhl.com',
  'dropbox.com', 'box.com', 'evernote.com', 'notion.so',
  'slack.com', 'zoom.us', 'teams.microsoft.com',
  'reddit.com', 'discord.com', 'telegram.org', 'signal.org',
  'wikimedia.org', 'wikipedia.org', 'stackexchange.com'
];

// URL shorteners that are used legitimately but worth noting in scam context
// These are NOT flagged on their own — only when combined with other scam signals
const URL_SHORTENERS = [
  /bit\.ly/i, /tinyurl/i, /t\.co/i, /goo\.gl/i, /ow\.ly/i,
  /is\.gd/i, /buff\.ly/i, /amzn\.to/i, /fb\.me/i
];

const KNOWN_SCAM_PHRASES = [
  "you have won", "congratulations you've been selected",
  "claim your prize", "act now or lose", "limited offer",
  "nigerian prince", "inheritance", "beneficiary",
  "dear friend", "dear beloved", "dear beneficiary",
  "kindly send", "kindly provide", "kindly reply",
  "god bless you", "in the name of god",
  "lottery winner", "sweepstakes", "you've won",
  "locked out of account", "unusual sign-in activity",
  "your package couldn't be delivered",
  "refund pending", "tax refund"
];

// --- Analysis Functions ---

// Score a message for scam indicators (0-100)
function analyzeMessage(text) {
  if (!text) return { score: 0, flags: [], category: 'clean' };

  const flags = [];
  let score = 0;
  const lowerText = text.toLowerCase();

  // Check each pattern category
  for (const [category, patterns] of Object.entries(SCAM_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(text)) {
        flags.push({ category, pattern: pattern.source, match: text.match(pattern)?.[0] });
        score += category === 'romance' ? 15 : category === 'crypto' ? 12 : 10;
      }
    }
  }

  // Check known scam phrases
  for (const phrase of KNOWN_SCAM_PHRASES) {
    if (lowerText.includes(phrase)) {
      flags.push({ category: 'known_scam', phrase });
      score += 20;
    }
  }

  // Check for urgency + money combination (very high risk)
  const hasUrgency = SCAM_PATTERNS.urgency.some(p => p.test(text));
  const hasMoney = SCAM_PATTERNS.financial.some(p => p.test(text));
  if (hasUrgency && hasMoney) {
    flags.push({ category: 'combo', reason: 'urgency + financial pressure' });
    score += 25;
  }

  // Check for authority + urgency
  const hasAuthority = SCAM_PATTERNS.authority.some(p => p.test(text));
  if (hasAuthority && hasUrgency) {
    flags.push({ category: 'combo', reason: 'authority impersonation + urgency' });
    score += 20;
  }

  // Check for shortened URLs — only flag contextually (not standalone)
  const hasShortener = URL_SHORTENERS.some(p => p.test(text));
  if (hasShortener) {
    // Only boost if other scam signals already present
    if (hasUrgency || hasMoney || hasAuthority) {
      flags.push({ category: 'suspicious_url', detail: 'Shortened URL in suspicious context' });
      score += 10;
    } else {
      // Just note it, minimal impact — legitimate services use shorteners
      flags.push({ category: 'info', detail: 'Shortened URL detected (common in legit marketing)' });
      score += 2;
    }
  }

  // Cap at 100
  score = Math.min(score, 100);

  // Determine category
  let category = 'clean';
  if (score >= 70) category = 'HIGH_RISK';
  else if (score >= 40) category = 'SUSPICIOUS';
  else if (score >= 15) category = 'LOW_RISK';

  return { score, flags, category, textLength: text.length };
}

// Check a crypto address against known scam databases
async function checkCryptoAddress(address) {
  const result = { address, risk: 'unknown', details: [] };

  // Check format
  if (/^0x[0-9a-fA-F]{40}$/.test(address)) {
    result.chain = 'Ethereum/EVM';

    // Check if it's a known contract
    const knownScamAddresses = [
      '0x0000000000000000000000000000000000000000',
      '0x000000000000000000000000000000000000dead'
    ];

    if (knownScamAddresses.includes(address.toLowerCase())) {
      result.risk = 'HIGH';
      result.details.push('Known burn/null address');
    }

    // Check Ethplorer for suspicious activity
    try {
      const res = await httpReq(`https://api.ethplorer.io/getAddressInfo/${address}?apiKey=freekey`);
      if (res.status === 200) {
        const data = JSON.parse(res.body);
        const ethBalance = data.ETH?.balance || 0;
        const tokenCount = (data.tokens || []).length;

        // Very new address with many tokens = suspicious
        if (tokenCount > 50 && ethBalance < 0.01) {
          result.risk = 'MEDIUM';
          result.details.push(`${tokenCount} tokens but low ETH balance — possible dust attack`);
        }

        // Check for known scam token names
        const scamTokenNames = ['claim', 'reward', 'visit', 'airdrop', 'bonus'];
        const scamTokens = (data.tokens || []).filter(t => {
          const name = (t.tokenInfo?.name || '').toLowerCase();
          const symbol = (t.tokenInfo?.symbol || '').toLowerCase();
          return scamTokenNames.some(s => name.includes(s) || symbol.includes(s));
        });

        if (scamTokens.length > 0) {
          result.risk = result.risk === 'HIGH' ? 'HIGH' : 'MEDIUM';
          result.details.push(`${scamTokens.length} suspicious tokens (likely scam airdrops)`);
        }

        if (result.risk === 'unknown') result.risk = 'LOW';
      }
    } catch(e) {
      result.details.push('Could not verify address');
    }
  } else if (/^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(address)) {
    result.chain = 'Bitcoin';
    result.risk = 'LOW';
    result.details.push('Bitcoin address format valid');
  } else if (/^T[a-zA-Z0-9]{33}$/.test(address)) {
    result.chain = 'Tron';
    result.risk = 'MEDIUM';
    result.details.push('Tron address — common in scams');
  } else {
    result.risk = 'UNKNOWN';
    result.details.push('Unrecognized address format');
  }

  return result;
}

// Check a URL for phishing indicators
function checkUrl(url) {
  const result = { url, risk: 'LOW', details: [] };

  try {
    const parsed = new URL(url);

    // Check if this is a trusted domain first — if so, always LOW risk
    const isTrustedHost = TRUSTED_DOMAINS.some(d => 
      parsed.hostname === d || parsed.hostname.endsWith('.' + d)
    );
    if (isTrustedHost) {
      result.risk = 'LOW';
      result.details.push('Trusted domain');
      return result;
    }

    // Check suspicious TLDs
    const suspiciousTlds = ['.xyz', '.top', '.buzz', '.club', '.work', '.gq', '.ml', '.tk', '.cf', '.ga'];
    if (suspiciousTlds.some(tld => parsed.hostname.endsWith(tld))) {
      result.risk = 'HIGH';
      result.details.push(`Suspicious TLD: ${parsed.hostname}`);
    }

    // Check for typosquatting against known legitimate domains
    for (const legit of TRUSTED_DOMAINS.slice(0, 15)) { // Top 15 trusted domains
      // Skip if this IS the legitimate domain or a legitimate subdomain of it
      if (parsed.hostname === legit || parsed.hostname.endsWith('.' + legit)) continue;

      const baseDomain = legit.split('.')[0];
      const variations = [
        legit.replace('o', '0'), legit.replace('e', '3').replace('a', '4'),
        legit.replace('.', '-'), 'secure-' + legit, legit + '-login.com',
        baseDomain + '-secure.com', 'login-' + baseDomain + '.com'
      ];
      if (variations.some(v => parsed.hostname.includes(v.split('.')[0]))) {
        result.risk = 'HIGH';
        result.details.push(`Possible typosquatting of ${legit}`);
      }
    }

    // Check for IP address in URL
    if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(parsed.hostname)) {
      result.risk = 'HIGH';
      result.details.push('IP address in URL — suspicious');
    }

    // Check for data URIs
    if (url.startsWith('data:')) {
      result.risk = 'HIGH';
      result.details.push('Data URI — potential phishing');
    }

    // Check path for phishing keywords — skip on trusted domains (already handled above)
    if (result.risk === 'LOW') {
      const phishingPath = /login|signin|verify|account|secure|update|confirm/i;
      if (phishingPath.test(parsed.pathname)) {
        result.risk = 'MEDIUM';
        result.details.push('URL path contains login/verification keywords');
      }
    }
  } catch(e) {
    result.risk = 'UNKNOWN';
    result.details.push('Invalid URL format');
  }

  return result;
}

// Check phone number
function checkPhone(phone) {
  const result = { phone, risk: 'UNKNOWN', details: [] };

  // Clean the number
  const cleaned = phone.replace(/[^\d+]/g, '');

  // Check for premium rate numbers
  if (/^\+?1?900/.test(cleaned) || /^\+?1?976/.test(cleaned)) {
    result.risk = 'HIGH';
    result.details.push('Premium rate number');
  }

  // Check for spoofed patterns
  if (/^(\d)\1{6,}$/.test(cleaned.replace('+', ''))) {
    result.risk = 'HIGH';
    result.details.push('Repeating digits — likely spoofed');
  }

  // Check for common scam area codes
  const scamAreaCodes = ['232', '242', '246', '268', '284', '345', '441', '473', '649', '664', '721', '758', '767', '784', '787', '809', '829', '849', '868', '869', '876', '939'];
  const areaCode = cleaned.replace('+1', '').substring(0, 3);
  if (scamAreaCodes.includes(areaCode)) {
    result.risk = 'MEDIUM';
    result.details.push(`Area code ${areaCode} — commonly used in scams`);
  }

  if (result.risk === 'UNKNOWN') result.risk = 'LOW';

  return result;
}

// --- Main ---
const input = process.argv[2];
const type = process.argv[3] || 'message'; // message, url, crypto, phone

async function main() {
  if (!input) {
    console.log(JSON.stringify({ error: 'No input provided. Usage: node scam-shield.js <input> [type]' }));
    return;
  }

  let result;

  switch (type) {
    case 'message':
      result = analyzeMessage(input);
      break;
    case 'url':
      result = checkUrl(input);
      break;
    case 'crypto':
      result = await checkCryptoAddress(input);
      break;
    case 'phone':
      result = checkPhone(input);
      break;
    default:
      // Auto-detect
      if (/^0x[0-9a-fA-F]{40}$/.test(input)) {
        result = await checkCryptoAddress(input);
      } else if (/^https?:\/\//i.test(input)) {
        result = checkUrl(input);
      } else if (/^\+?\d{7,15}$/.test(input.replace(/[^\d+]/g, ''))) {
        result = checkPhone(input);
      } else {
        result = analyzeMessage(input);
      }
  }

  console.log(JSON.stringify(result, null, 2));
}

main();
