(function(root,factory){const api=factory();if(typeof module==='object')module.exports=api;else root.Lens=api})(globalThis,function(){
 'use strict';
 const day=d=>{try{return typeof d==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(d)&&new Date(d+'T00:00:00Z').toISOString().slice(0,10)===d}catch{return false}};
 function match(q,c){
  const no=reason=>({eligible:false,reason});
  if(q.sourceProblem||c.sourceProblem)return no('来源链接存在已知缺口，先补证');if(q.id===c.id)return no('当前事件');if(c.date>=q.date)return no('非当前事件之前的历史案例');
  if(q.region!==c.region)return no('地区不同，需另行核对跨市场可比性');
  const qa=q.actor||q.subject,ca=c.actor||c.subject;
  if(q.family==='inflation'&&c.family==='inflation'){
   if(qa!==ca||q.stage!=='data_release'||c.stage!=='data_release')return no('发布主体或事件阶段不同');
   const qi=q.indicators||[],ci=c.indicators||[],shared=qi.filter(x=>ci.includes(x));if(!qi.length||!ci.length)return no('价格指标口径待核');
   const exact=shared.length===qi.length&&shared.length===ci.length;
   return {eligible:true,level:exact?'same_indicator':shared.length?'shared_indicator':'related_price',rank:exact?1:shared.length?2:3,reason:exact?'同一指标口径 '+shared.join(' / '):shared.length?'共同指标 '+shared.join(' / ')+' · 覆盖范围不同':`相关价格观察 · ${qi.join(' / ')}与${ci.join(' / ')}口径不同`,difference:`查询覆盖 ${qi.join(' / ')}；候选覆盖 ${ci.join(' / ')}。${exact?'仍需核对统计期、读数和宏观背景。':'只作补充对照，不作为相同指标样本。'}`};
  }
  if(qa!==ca)return no('主体不同');if(q.direction==='unknown'||q.direction!==c.direction)return no('行动方向不同或未知');
  if(q.tool===c.tool&&q.stage===c.stage)return {eligible:true,level:'same_tool',rank:1,reason:'同主体 · 同工具 · 同方向及阶段',difference:'仍需核对力度、对象和环境。'};
  if(q.family==='monetary_policy'&&c.family==='monetary_policy')return {eligible:true,level:'related_policy',rank:3,reason:'同政策主体与方向 · 工具或阶段不同',difference:`查询：${q.tool} / ${q.stage}；候选：${c.tool} / ${c.stage}。仅作政策主题关联，传导与力度不等同。`};
  return no('工具或事件阶段不同');
 }
 function publicUrl(value){try{const u=new URL(value);return ['http:','https:'].includes(u.protocol)&&!u.username&&!u.password&&![...u.searchParams.keys()].some(k=>/key|token|secret|signature|authorization/i.test(k))}catch{return false}}
 function observe(asset,anchor,n=20){
  const empty={status:'missing',reason:'行情缺失',value:null,path:[],base:null,end:null,count:0};
  if(!day(anchor)||![1,5,20].includes(n))return {...empty,status:'invalid',reason:'日期或窗口无效'};
  if(!asset||!Array.isArray(asset.points)||!asset.points.length)return empty;
  const p=asset.points;let i=p.findIndex(x=>x.date>=anchor);if(i<0)return {...empty,status:'unfinished',reason:'该日期轴之后没有演示点'};if(i===0)return {...empty,reason:'构造序列缺少基准点'};
  const base=p[i-1],rows=p.slice(i,i+n),full=[base,...rows];
  if(full.some((x,j)=>!day(x.date)||!Number.isFinite(x.close)||x.close<=0||(j&&x.date<=full[j-1].date)))return {...empty,status:'invalid',reason:'价格无效、重复日期或日期乱序'};
  if(full.some((x,j)=>j&&(Date.parse(x.date)-Date.parse(full[j-1].date))/86400000>15))return {...empty,status:'gap',reason:'窗口内构造日期轴间隔超过15个自然日，未跳过缺口补齐'};
  if((Date.parse(anchor)-Date.parse(base.date))/86400000>15)return {...empty,status:'gap',reason:'基准演示点日期过旧'};
  const before=p.slice(Math.max(0,i-21),i),path=[...before,...rows].map((x,j)=>({date:x.date,close:x.close,t:j-before.length+1,value:(x.close/base.close-1)*100}));
  return {status:rows.length===n?'complete':'partial',reason:rows.length===n?'按有效演示点计数；构造日期轴不是交易日历':'可用演示观察期不足，变化保持空值',base,end:rows.at(-1)||null,count:rows.length,value:rows.length===n?(rows.at(-1).close/base.close-1)*100:null,path};
 }
 function report(data,q,cases,assetKey,n){const results=[q,...cases].map(e=>({event:e,result:observe(data.assets[assetKey],e.anchor,n)}));const note=data.notes[q.group]||{shared:'依据用户材料中的主体、工具与时间寻找线索，尚未独立核实。',difference:'需要进一步核对事件形式、背景与可比边界。',hypothesis:'当前离线资料不足以形成具体传导解释，需补证。'};return {eventId:q.id,cases:cases.map(x=>x.id),assetKey,n,createdAt:new Date().toISOString(),facts:q.fact,results,shared:note.shared,difference:note.difference,hypothesis:note.hypothesis,limits:['历史观察不能证明事件因果作用，也不构成当前收益预测。','预期差、历史宏观首发版本和其他同期事件控制未完成。','相似案例按事件材料匹配，未用事后涨跌筛选。','AI段落为离线预研；本次按钮只组装所选案例与确定性计算结果。'],sources:[...new Map([q,...cases].flatMap(e=>e.sources).map(s=>[s.url,s])).values()]};}
 return {day,publicUrl,match,observe,report};
});
