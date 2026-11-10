// Create deterministic, openly redistributable demo prices. These are fictional
// values and are intentionally independent of event dates and event outcomes.
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../..');
const file = path.join(root, 'frontend/data.json');
const data = JSON.parse(fs.readFileSync(file, 'utf8'));

function random(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6D2B79F5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function normal(next) {
  const u = Math.max(next(), Number.EPSILON);
  const v = next();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function weekdayPoints(start, end, initial, seed, volatility) {
  const next = random(seed);
  const points = [];
  let close = initial;
  for (let ms = Date.parse(`${start}T00:00:00Z`); ms <= Date.parse(`${end}T00:00:00Z`); ms += 86400000) {
    const date = new Date(ms);
    const weekday = date.getUTCDay();
    if (weekday === 0 || weekday === 6) continue;
    close *= Math.exp(normal(next) * volatility);
    points.push({ date: date.toISOString().slice(0, 10), close: Number(close.toFixed(2)) });
  }
  return points;
}

const scope = data.scope;
const notice = '构造演示价格；不是实际历史行情，不代表真实资产表现，不应用于投资决策。日期轴也不是交易所交易日历。';
for (const [key, spec] of Object.entries({
  equity: { name: '上证指数示意', unit: '指数点（演示刻度）', initial: 3200, seed: 0x1A2B3C4D, volatility: 0.008 },
  gold: { name: '黄金价格示意', unit: '元/克（演示刻度）', initial: 520, seed: 0x5EED9999, volatility: 0.007 },
})) {
  const asset = data.assets[key];
  asset.name = spec.name;
  asset.unit = spec.unit;
  delete asset.code;
  asset.points = weekdayPoints(scope[0], scope[1], spec.initial, spec.seed, spec.volatility);
  asset.first = asset.points[0].date;
  asset.last = asset.points.at(-1).date;
  asset.source = '本地固定种子生成的构造序列（非市场报价）';
  asset.synthetic = true;
  asset.limitations = notice;
  asset.sha256 = require('crypto').createHash('sha256').update(JSON.stringify(asset.points)).digest('hex');
}

for (const event of data.events) {
  event.anchor = new Date(Date.parse(`${event.date}T00:00:00Z`) + 86400000).toISOString().slice(0, 10);
  event.timeNote = '演示对齐：从记录事件日的次日起，在构造的周一至周五日期轴选取后续演示点；基准为前一个演示点。该日期轴不代表交易日历。';
}

data.marketDataMode = {
  type: 'synthetic_demo',
  generated_by: 'backend/scripts/build-synthetic-market.cjs',
  notice,
  series_specs: {
    equity: { name: '上证指数示意', unit: '指数点（演示刻度）', initial: 3200, seed: 0x1A2B3C4D, daily_volatility: 0.008 },
    gold: { name: '黄金价格示意', unit: '元/克（演示刻度）', initial: 520, seed: 0x5EED9999, daily_volatility: 0.007 },
  },
  relation_to_events: '价格变化由独立固定种子生成，与事件日期、事件类型和事件结果无关。',
};
data.latestCheck = { status: 'not_applicable', note: '构造样例没有市场数据供应商，也没有实时更新任务。' };
data.rights = '事件条目保留来源链接和逐条核查状态。行情是由本仓库脚本生成的构造演示值，不是供应商数据或真实历史行情。';

fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
const counts = Object.fromEntries(Object.keys(data.groups).map(key => [key, data.events.filter(event => event.group === key).length]));
const inventory = {
  preparedAt: data.preparedAt,
  scope: data.scope,
  total: data.events.length,
  groups: counts,
  assets: Object.fromEntries(Object.entries(data.assets).map(([key, a]) => [key, {
    name: a.name, unit: a.unit, first: a.first, last: a.last,
    points: a.points.length, sha256: a.sha256, synthetic: true, source: a.source,
  }])),
  coverage: data.coverage,
  marketDataMode: data.marketDataMode,
};
fs.writeFileSync(path.join(root, 'evidence/data-inventory.json'), `${JSON.stringify(inventory, null, 2)}\n`, 'utf8');
console.log(`Generated ${data.assets.equity.points.length} + ${data.assets.gold.points.length} clearly labeled synthetic observations.`);
