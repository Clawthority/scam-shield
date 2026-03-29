# 🛡️ Scam Shield

**The scam detection engine that analyzes messages, URLs, crypto addresses, and phone numbers — before you click, send, or lose money.**

Scammers cast a wide net. Most people rely on gut feeling to spot them. Scam Shield gives you an instant risk score on anything suspicious — a DM, a link, a crypto wallet, a phone number. Paste it in, get an answer.

Works as a Telegram bot, CLI tool, or API. Drop it into your workflow, your family group chat, or your product.

## ✨ Key Features

- **Instant risk scoring** — 0–100 score with matched pattern explanations
- **Multi-surface detection** — Messages, URLs, crypto addresses, phone numbers
- **100+ scam patterns** — Continuously updated detection rules
- **Zero friction** — No signup, no install — just paste and check
- **Multiple interfaces** — Telegram bot, CLI, or embeddable API
- **Free tier included** — 10 checks/day, no credit card required

## How It Works

```
1. You receive something suspicious (message, link, number, wallet address)
2. Paste it into Scam Shield (Telegram bot, CLI, or API)
3. Auto-detect input type or specify: message, url, crypto, phone
4. Get instant risk score + matched scam patterns explained
5. Make an informed decision — block, ignore, or proceed with caution
```

## What It Detects (100+ patterns)

| Surface | What It Checks |
|---------|---------------|
| **Messages** | Urgency tactics, financial manipulation, authority impersonation, romance scams, crypto scams, phishing, social engineering |
| **URLs** | Suspicious TLDs, typosquatting, IP addresses, phishing paths |
| **Crypto** | Burn addresses, dust attacks, known scam tokens |
| **Phones** | Premium rates, spoofed numbers, scam area codes |

## Scam Patterns Detected (100+ patterns)

- 🚨 **Urgency/fear tactics** — "Act now!", "Expires soon!", "Limited time!"
- 💰 **Financial manipulation** — "Guaranteed returns!", "Double your money!"
- 👮 **Authority impersonation** — "IRS", "FBI", "Your account is suspended"
- 💕 **Romance scams** — "I love you", "I'm stranded", "Send money"
- ₿ **Crypto scams** — "Connect your wallet", "Free airdrop", "Double your BTC"
- 🎣 **Phishing** — "Click here to verify", "Update your password"
- 🧠 **Social engineering** — "Keep this secret", "Trust me", "Not a scam"

## 🤖 Telegram Bot

Scam Shield runs as a Telegram bot. Check anything suspicious instantly:

1. Open [@ScamShieldBot](https://t.me/ScamShieldBot) on Telegram
2. Forward a suspicious message or paste a link/number/address
3. Get instant risk score with explanations
4. No app install, no account — just open and paste

## Who It's For

- **Everyone** — You get scam messages daily. Now you can check them instantly.
- **Families** — Protect less tech-savvy relatives. Forward suspicious messages and get a verdict.
- **Small businesses** — Verify leads, invoices, and links before acting on them.
- **Developers** — Drop the API into your product to add scam detection in minutes.
- **Crypto users** — Check wallet addresses and token contracts before connecting or sending.

## Quick Start

```bash
# Analyze a message
echo "Congratulations! You won $10,000! Click here to claim!" | node scanner.js "$(cat)" message | node format.js

# Check a URL
node scanner.js "https://secure-login.xyz/verify" url | node format.js

# Check a crypto address
node scanner.js "0x1234..." crypto | node format.js

# Auto-detect input type
node scanner.js "suspicious message or url or address" | node format.js
```

## Scoring

| Score | Category | Meaning |
|-------|----------|---------|
| 70-100 | 🚨 HIGH_RISK | Strong scam indicators. Do not engage. |
| 40-69 | ⚠️ SUSPICIOUS | Some red flags. Verify before acting. |
| 15-39 | ⚡ LOW_RISK | Minor indicators. Usually safe. |
| 0-14 | ✅ CLEAN | No scam indicators detected. |

## Setup

```bash
# Clone and install
git clone https://github.com/your-org/scam-shield.git
cd scam-shield
npm install

# Set up environment (optional — works without API keys for basic checks)
cp .env.example .env
# Edit .env with your config

# Run a quick test
node scanner.js "Congratulations! You won $10,000!" message | node format.js
```

## Monetization

| Tier | Price | Features |
|------|-------|----------|
| Free | $0 | 10 checks/day via Telegram |
| Premium | $5/month | Unlimited checks, family protection |
| Business API | $100/month | Unlimited API calls, webhook integration |
| Enterprise | $500/month | White-label, custom patterns, priority support |

## Related Products

- **[Scam Academy](../scam-academy)** — Train yourself to spot scams with interactive simulations. Scam Shield detections feed directly into Scam Academy training scenarios.

## Contributing

Issues and PRs welcome. To add new scam patterns, edit the pattern files in `patterns/` and run the test suite:

```bash
npm test
```

## License

MIT
