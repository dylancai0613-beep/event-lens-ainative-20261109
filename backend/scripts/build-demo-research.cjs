// Recreate shareable demonstration outputs using only explicitly synthetic prices.
const fs = require('fs');
const path = require('path');
const data = require('../../frontend/data.json');
const Lens = require('../../frontend/engine.js');
if (data.marketDataMode?.type !== 'synthetic_demo') throw new Error('Refusing to write sample research from non-synthetic market data.');
const event = data.events.find(item => item.id === 'RECENT-20260909-PRICES');
const cases = data.events.filter(item => Lens.match(event, item).eligible).slice(0, 2);
if (!cases.length) throw new Error('No eligible historical candidates for the demo report.');
const report = Lens.report(data, event, cases, 'equity', 20);
const output = {
  title: event.title,
  research_status: 'illustrative_demo_only',
  warning: data.marketDataMode.notice,
  market_data_mode: data.marketDataMode,
  event: { id: event.id, title: event.title, date: event.date, fact: event.fact, sources: event.sources, verification: event.verification },
  historical_cases: cases.map(item => ({ id: item.id, title: item.title, date: item.date, match: Lens.match(event, item), sources: item.sources })),
  calculation: report.results.map(item => ({ title: item.event.title, date: item.event.date, baseline_date: item.result.base?.date ?? null, baseline_value: item.result.base?.close ?? null, endpoint_date: item.result.end?.date ?? null, endpoint_value: item.result.end?.close ?? null, change_pct: item.result.value, status: item.result.status, label: '仅为构造数据演算' })),
  method: '确定性窗口计算；不含真实历史行情，不证明事件因果，不构成投资建议。',
};
const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
const html = `<!doctype html><html lang="zh-CN"><meta charset="utf-8"><title>以事为镜 · 构造演示报告</title><style>body{max-width:880px;margin:32px auto;padding:24px;background:#101112;color:#e8e6e1;font:15px/1.75 system-ui,"Microsoft YaHei",sans-serif}h1,h2{color:#f0a060}.warning{padding:14px;border:1px solid #74543c;background:#211c18}a{color:#ffbd83}.sample{padding:14px;margin:12px 0;border:1px solid #303335}small{color:#a4a19a}</style><h1>${esc(event.title)}</h1><p class="warning"><strong>构造行情演算，不是真实价格</strong><br>${esc(data.marketDataMode.notice)}</p><section class="sample"><h2>事件事实</h2><p>${esc(event.fact)}</p><p>${esc(event.verification)}</p>${event.sources.map(source => `<p><a href="${esc(source.url)}">${esc(source.title)}</a> · ${esc(source.status)}</p>`).join('')}</section><section class="sample"><h2>案例筛选</h2>${cases.map(item => `<p>${esc(item.date)} · ${esc(item.title)} · ${esc(Lens.match(event, item).reason)} · ${esc(Lens.match(event, item).difference)}</p>`).join('')}</section><section class="sample"><h2>窗口计算（构造值）</h2><p>资产：上证指数概念；20个构造点。</p><ul>${output.calculation.map(item => `<li>${esc(item.title)}：${esc(item.baseline_date)} ${item.baseline_value} → ${esc(item.endpoint_date)} ${item.endpoint_value}，${item.change_pct === null ? '观察不足' : `${item.change_pct.toFixed(2)}%`}</li>`).join('')}</ul><p>这些结果只检查程序计算过程。${esc(output.method)}</p></section><small>离线AI预研 + 确定性演示计算。网页未调用在线模型。</small></html>`;
const root = path.resolve(__dirname, '../..');
fs.writeFileSync(path.join(root, 'evidence/sample-research.json'), `${JSON.stringify(output, null, 2)}\n`, 'utf8');
fs.writeFileSync(path.join(root, 'evidence/sample-report.html'), html, 'utf8');
console.log('Rebuilt explicitly labeled synthetic demonstration report.');
