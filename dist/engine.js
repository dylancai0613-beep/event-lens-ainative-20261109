(function(root,factory){const api=factory();if(typeof module==='object')module.exports=api;else root.Lens=api})(globalThis,function(){
 'use strict';
 const day=d=>{try{return typeof d==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(d)&&new Date(d+'T00:00:00Z').toISOString().slice(0,10)===d}catch{return false}};
 function match(q,c){if(q.sourceProblem||c.sourceProblem)return {eligible:false,reason:'来源链接存在已知缺口，先补证'};if(q.id===c.id)return {eligible:false,reason:'当前事件'};if(c.date>=q.date)return {eligible:false,reason:'非当前事件之前的历史案例'};if(q.group!==c.group||q.tool!==c.tool||q.subject!==c.subject)return {eligible:false,reason:'主体或具体工具不同'};if(q.direction==='unknown'||q.direction!==c.direction)return {eligible:false,reason:'行动方向不同或未知'};return {eligible:true,reason:'同主体 · 同工具/发布主题 · 同方向 · 历史在前'};}
 function publicUrl(value){try{const u=new URL(value);return ['http:','https:'].includes(u.protocol)&&!u.username&&!u.password&&![...u.searchParams.keys()].some(k=>/key|token|secret|signature|authorization/i.test(k))}catch{return false}}
 function observe(asset,anchor,n=20){
  const empty={status:'missing',reason:'行情缺失',value:null,path:[],base:null,end:null,count:0};
  if(!day(anchor)||![1,5,20].includes(n))return {...empty,status:'invalid',reason:'日期或窗口无效'};
  if(!asset||!Array.isArray(asset.points)||!asset.points.length)return empty;
  const p=asset.points;let i=p.findIndex(x=>x.date>=anchor);if(i<0)return {...empty,status:'unfinished',reason:'该日期尚无后续行情'};if(i===0)return {...empty,reason:'缺少基准日前收盘'};
  const base=p[i-1],rows=p.slice(i,i+n),full=[base,...rows];
  if(full.some((x,j)=>!day(x.date)||!Number.isFinite(x.close)||x.close<=0||(j&&x.date<=full[j-1].date)))return {...empty,status:'invalid',reason:'价格无效、重复日期或日期乱序'};
  if(full.some((x,j)=>j&&(Date.parse(x.date)-Date.parse(full[j-1].date))/86400000>15))return {...empty,status:'gap',reason:'窗口内有超过15个自然日的报价断层，未跳过缺口补齐'};
  if((Date.parse(anchor)-Date.parse(base.date))/86400000>15)return {...empty,status:'gap',reason:'基准报价过旧'};
  const before=p.slice(Math.max(0,i-21),i),path=[...before,...rows].map((x,j)=>({date:x.date,close:x.close,t:j-before.length+1,value:(x.close/base.close-1)*100}));
  return {status:rows.length===n?'complete':'partial',reason:rows.length===n?'按有效报价观测计数；未独立验证完整交易日历':'可用观察期不足，收益保持空值',base,end:rows.at(-1)||null,count:rows.length,value:rows.length===n?(rows.at(-1).close/base.close-1)*100:null,path};
 }
 function report(data,q,cases,assetKey,n){const results=[q,...cases].map(e=>({event:e,result:observe(data.assets[assetKey],e.anchor,n)}));const note=data.notes[q.group];return {eventId:q.id,cases:cases.map(x=>x.id),assetKey,n,createdAt:new Date().toISOString(),facts:q.fact,results,shared:note.shared,difference:note.difference,hypothesis:note.hypothesis,limits:['历史观察不能证明事件因果作用，也不构成当前收益预测。','预期差、历史宏观首发版本和其他同期事件控制未完成。','相似案例按事件材料匹配，未用事后涨跌筛选。','AI段落为离线预研；本次按钮只组装所选案例与确定性计算结果。'],sources:[...new Map([q,...cases].flatMap(e=>e.sources).map(s=>[s.url,s])).values()]};}
 return {day,publicUrl,match,observe,report};
});
