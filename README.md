# 🛡️ Scam Shield

Multi-surface scam detection engine. Analyzes messages, URLs, crypto addresses, and phone numbers for scam indicators.

## What It Detects

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

## Monetization

| Tier | Price | Features |
|------|-------|----------|
| Free | $0 | 10 checks/day via Telegram |
| Premium | $5/month | Unlimited checks, family protection |
| Business API | $100/month | Unlimited API calls, webhook integration |
| Enterprise | $500/month | White-label, custom patterns, priority support |

## License

MIT
