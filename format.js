#!/usr/bin/env node
const chunks = [];
process.stdin.on('data', chunk => chunks.push(chunk));
process.stdin.on('end', () => {
  const r = JSON.parse(chunks.join(''));
  const lines = [];

  if (r.error) {
    lines.push(`❌ ${r.error}`);
    console.log(lines.join('\n'));
    return;
  }

  // Risk emoji
  const riskEmoji = {
    HIGH: '🚨', HIGH_RISK: '🚨',
    MEDIUM: '⚠️', SUSPICIOUS: '⚠️',
    LOW: '✅', LOW_RISK: '✅',
    UNKNOWN: '❓',
    clean: '✅'
  };

  const emoji = riskEmoji[r.category] || riskEmoji[r.risk] || '❓';

  lines.push(`${emoji} **Scam Shield Analysis**`);
  lines.push('');

  if (r.score !== undefined) {
    // Message analysis
    lines.push(`**Risk Score:** ${r.score}/100`);
    lines.push(`**Category:** ${r.category}`);
    lines.push('');

    if (r.flags && r.flags.length > 0) {
      lines.push(`**Red Flags (${r.flags.length}):**`);
      for (const f of r.flags.slice(0, 10)) {
        lines.push(`  ⚠️ ${f.category}: ${f.reason || f.phrase || f.match || f.detail || 'Suspicious pattern'}`);
      }
      lines.push('');
    }

    // Recommendation
    if (r.category === 'HIGH_RISK') {
      lines.push(`🚨 **RECOMMENDATION: DO NOT ENGAGE**`);
      lines.push(`This message shows strong scam indicators. Block and report.`);
    } else if (r.category === 'SUSPICIOUS') {
      lines.push(`⚠️ **RECOMMENDATION: PROCEED WITH CAUTION**`);
      lines.push(`Some red flags detected. Verify independently before acting.`);
    } else if (r.category === 'LOW_RISK') {
      lines.push(`✅ **Low risk but stay alert**`);
      lines.push(`Minor indicators found. Usually safe but verify if asked for money/info.`);
    } else {
      lines.push(`✅ **No scam indicators detected**`);
    }
  } else if (r.risk) {
    // URL/crypto/phone analysis
    lines.push(`**Risk Level:** ${r.risk}`);
    if (r.chain) lines.push(`**Chain:** ${r.chain}`);
    if (r.url) lines.push(`**URL:** ${r.url}`);
    if (r.address) lines.push(`**Address:** ${r.address.slice(0, 20)}...`);
    if (r.phone) lines.push(`**Phone:** ${r.phone}`);
    lines.push('');

    if (r.details && r.details.length > 0) {
      for (const d of r.details) {
        lines.push(`  ${r.risk === 'HIGH' ? '🚨' : r.risk === 'MEDIUM' ? '⚠️' : 'ℹ️'} ${d}`);
      }
    }
  }

  console.log(lines.join('\n'));
});
