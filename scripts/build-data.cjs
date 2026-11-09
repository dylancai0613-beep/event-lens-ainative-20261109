const fs=require('fs'),vm=require('vm'),crypto=require('crypto');
const path=require('path'),root=path.resolve(__dirname,'..');
const base='D:/光大/全能复盘王/source/ui2/fixtures/public/';
const ctx={window:{}};vm.createContext(ctx,{codeGeneration:{strings:false,wasm:false}});
for(const name of ['replay-studio-data.js','event-catalogue-index.js'])vm.runInContext(fs.readFileSync(base+name,'utf8'),ctx,{timeout:15000});
const w=ctx.window,fm=new Map(w.FINANCE_PREVIEW_DATA.events.map(x=>[x.id,x]));
const range=['2023-11-09','2026-11-09'];
const groups={cnpolicy:{name:'中国货币政策',tool:'LPR',subject:'中国人民银行授权公布 LPR',region:'中国'},fed:{name:'美联储利率决议',tool:'联邦基金利率目标区间',subject:'FOMC',region:'美国'},cpi:{name:'重要通胀数据',tool:'中国 CPI 发布',subject:'国家统计局',region:'中国'}};
const verified=new Set(['RECENT-20240918-FOMC','RECENT-20241107-FOMC','RECENT-20241218-FOMC','RECENT-20240909-CPI','RECENT-20241013-CPI','RECENT-20240220-LPR_CUT','RECENT-20240722-LPR_CUT']);
const events=[];
for(const c of w.REPLAY_EVENT_INDEX.cards){
 if(c.occurred_on<range[0]||c.occurred_on>range[1])continue;
 const group=/LPR|贷款市场报价/.test(c.title+' '+c.summary)?'cnpolicy':/FOMC/.test(c.title)?'fed':/居民消费价格|\bCPI\b/.test(c.title)?'cpi':null;
 if(!group)continue;
 const openedUrls=new Set(['https://jrj.sh.gov.cn/SCGK194/20250214/65f4da70183342d08300c459502e0b9d.html',...['20240918','20241107','20241218','20231213'].map(x=>'https://www.federalreserve.gov/newsevents/pressreleases/monetary'+x+'a.htm'),'https://www.stats.gov.cn/sj/zxfb/202409/t20240909_1956311.html','https://www.stats.gov.cn/sj/zxfb/202410/t20241013_1956899.html','https://www.stats.gov.cn/xxgk/sjfb/zxfb2020/202502/t20250209_1958646.html','https://www.stats.gov.cn/sj/zxfb/202503/t20250309_1958915.html']);
 const sources=(fm.get(c.id)?.sources||[]).filter(s=>s.url).map(s=>({title:s.title,publisher:s.publisher,url:s.url,publicationDate:s.published_on,role:/retrospective/.test(s.verification)?'事后官方回顾':/stats.gov.cn|federalreserve.gov/.test(s.url)?'官方统计/决议发布':'原库关联来源',status:openedUrls.has(s.url)?'本次已打开，仅核对事件事实及日期':'沿用已发布卡片引用，本次未重新打开原文'}));
 if(!sources.length)continue;
 const date=c.first_public_at||c.occurred_on;
 const direction=group==='cpi'?'release':/维持|保持不变/.test(c.title)?'hold':/下降|下调|降息/.test(c.title)?'down':'unknown';
 events.push({id:c.id,group,...groups[group],date,eventDate:c.occurred_on,firstPublicDate:c.first_public_at||null,firstPublicTime:null,direction,title:c.title,fact:c.summary,stage:group==='cpi'?'data_release':'decision',sources,verification:verified.has(c.id)?'已核对关联公开来源':'原库事件，待重新核对原文',sourceKind:'published_card_excerpt',oldCardId:c.id,expectationGap:null,period:group==='cpi'?(c.title.match(/20\d\d年\d+月份/)||[])[0]||null:null,notes:group==='cnpolicy'?'LPR 调整涉及不同期限；贷款报价与实际贷款利率、政策利率并不等同。':group==='fed'?'决策幅度、就业与通胀背景不同；北京时间已进入次日。': '统计期与发布日期不同；同比、环比和基数效应需分别理解。'});
}
events.push({id:'LPR-20241021',group:'cnpolicy',...groups.cnpolicy,date:'2024-10-21',eventDate:'2024-10-21',firstPublicDate:null,firstPublicTime:null,direction:'down',title:'1年期和5年期以上 LPR 均下调25个基点',fact:'2024年10月21日，1年期 LPR 为3.10%，5年期以上 LPR 为3.60%，均较上期下调0.25个百分点。',stage:'decision',sources:[{title:'2024年中国货币政策大事记',publisher:'中国人民银行（上海市委金融办转载）',url:'https://jrj.sh.gov.cn/SCGK194/20250214/65f4da70183342d08300c459502e0b9d.html',publicationDate:'2025-02-14',role:'事后官方回顾',status:'本次已打开；不能证明最早公开时刻'}],verification:'官方事后回顾支持事实，首发时刻待核',sourceKind:'original_text',expectationGap:null,period:null,notes:'同时下调两个期限，与2024年2月仅5年期以上LPR下调存在差异。'});
for(const e of events){if(e.id==='RECENT-20240809-CPI'){e.sourceProblem=true;e.verification='本次访问原链接返回404，待补证';for(const s of e.sources)s.status='本次访问404，未重新核实原文';}if(['RECENT-20250209-PRICES','RECENT-20250309-PRICES','RECENT-20231213-FOMC'].includes(e.id)){e.verification='本次已打开官方来源核对事实';for(const s of e.sources)s.status='本次已打开官方来源；只支持事实与公开日期';}}
for(const e of events){
 if(e.group==='fed'){const target={'2024-09-18':'4.75%—5.00%','2024-11-07':'4.50%—4.75%','2024-12-18':'4.25%—4.50%'}[e.date]||'5.25%—5.50%';const bp=e.date==='2024-09-18'?50:25;e.fact=`${e.date}，FOMC决定${e.direction==='hold'?'维持':'下调'+bp+'个基点，调整后'}联邦基金利率目标区间为${target}。`;e.notes=e.direction==='hold'?`当次决定维持${target}；维持利率不等于预期路径相同。`:`当次下调${bp}个基点至${target}；幅度与政策阶段均需单独比较。`;}
 if(e.group==='cpi')e.fact=e.fact.split('其中')[0].replace(/\s+/g,'');
 if(e.id==='RECENT-20240220-LPR_CUT')e.notes='只下调5年期以上LPR 25基点，1年期维持不变；与两个期限同时调整存在差异。';
 if(e.id==='RECENT-20240722-LPR_CUT')e.notes='1年期与5年期以上LPR各下调10基点，幅度与2024年2月、10月不同。';
}
events.sort((a,b)=>a.date.localeCompare(b.date));
const nextDay=d=>new Date(Date.parse(d+'T00:00:00Z')+86400000).toISOString().slice(0,10);
for(const e of events){e.anchor=nextDay(e.date);e.timeNote=e.group==='fed'?'以美国声明日的次一中国日历日开始选取实际报价；2024年9/18、11/7、12/18声明为美东14:00，北京时间次日凌晨。其余记录未重新核对时分。':'采用保守的日级观察：从所记录公告/事件日期的次一日开始取实际报价，避开未知日内顺序；可能遗漏公告当日变化。';}
const server=JSON.parse(fs.readFileSync(path.join(root,'work/server-market.json'),'utf8'));
const assets={};for(const [key,assetKey,code]of[['equity','china_equity','000001.SH'],['gold','gold','S000025544']]){
 const a=w.REPLAY_CHART_DATA.assets.find(x=>x.key===assetKey),m=new Map(a.points.filter(p=>p[0]>=range[0]&&p[0]<=range[1]).map(p=>[p[0],p[1]]));
 for(const [date,v]of Object.entries(server.series[code]||{}))if(date>=range[0]&&date<=range[1]&&typeof v==='number')m.set(date,v);
 const points=[...m].sort((a,b)=>a[0].localeCompare(b[0])).map(([date,close])=>({date,close}));
 assets[key]={name:a.name,code,unit:a.unit,points,first:points[0]?.date,last:points.at(-1)?.date,source:'复盘王已发布历史行情快照 / iFinD 字段代码 '+code,sha256:crypto.createHash('sha256').update(JSON.stringify(points)).digest('hex'),limitations:key==='gold'?'人民币 Au9999，非美元国际现货金；2026年历史连续性需逐窗口检查，最新供应商更新因配额耗尽失败。':'价格指数涨跌，不含分红再投资；报价日序列不等同于已独立核验的交易日历。'};
}
const data={version:'1.0.0',preparedAt:new Date().toISOString(),scope:range,coverage:'从已发布事件索引按三类筛选，另补官方回顾支持的LPR节点；属于范围内的部分候选集，未扫全所有新闻及月份。',groups,events,assets,latestCheck:server.status,rights:'事件仅保留事实摘要、必要引用和公开链接；行情为用户授权取用的既有研究演示快照，供应商再分发许可未证明，不宣称开放数据授权。可用自有获准数据替换。',offlineAI:'Codex / Luna 参与资料整理；Codex 完成下列逐类预研片段。网页按选中案例和实际计算结果组装报告，不发起模型请求。',notes:{cnpolicy:{shared:'同一主体、同一LPR工具、同一调整方向，构成候选依据。',difference:'需逐条核对期限、幅度和当时融资环境；共同工具不意味着背景相同。',hypothesis:'LPR变化可能经融资成本与预期影响资产定价；当前材料没有证明这一传导，黄金还受汇率和全球因素影响。'},fed:{shared:'同为FOMC利率决定，并匹配下调或维持方向；不混合讲话、纪要与正式决议。',difference:'需核对各次决议的调整幅度、目标区间以及就业和通胀背景；相同方向不能视作同一政策阶段。',hypothesis:'利率路径可能与美元、实际利率及风险偏好共同作用。人民币黄金同时受人民币汇率影响，本产品未分解这些因素。'},cpi:{shared:'同一统计机构、同一中国CPI发布主题与发布阶段，形成可检查的统计发布对照。',difference:'同比方向、统计月份与基数不同；比较中未录入一致口径的市场预期，预期差保持未知。',hypothesis:'通胀信息可能改变政策预期，但价格变化还可能伴随其他政策和风险事件；此处只做观察性对照。'}}};
fs.mkdirSync(path.join(root,'dist'),{recursive:true});fs.writeFileSync(path.join(root,'dist/data.json'),JSON.stringify(data,null,2));
fs.mkdirSync(path.join(root,'evidence'),{recursive:true});
fs.writeFileSync(path.join(root,'evidence/data-inventory.json'),JSON.stringify({preparedAt:data.preparedAt,scope:range,total:events.length,groups:Object.fromEntries(Object.keys(groups).map(k=>[k,events.filter(e=>e.group===k).length])),assets:Object.fromEntries(Object.entries(assets).map(([k,a])=>[k,{code:a.code,first:a.first,last:a.last,points:a.points.length,sha256:a.sha256}])),coverage:data.coverage},null,2));
console.log('Built',events.length,'events',Object.keys(assets));
