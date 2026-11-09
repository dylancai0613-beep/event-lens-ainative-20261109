"""One versioned contract shared by the project Skill and the website. No network I/O."""
import copy,datetime as dt,hashlib,json,re,unicodedata
from urllib.parse import urlsplit
from pathlib import Path
try:
 from jsonschema import Draft202012Validator,FormatChecker,RefResolver
except ImportError:
 import sys
 deps=Path(__file__).resolve().parents[3]/'dependencies'
 if deps.is_dir():sys.path.insert(0,str(deps))
 from jsonschema import Draft202012Validator,FormatChecker,RefResolver
SCHEMA_PATH=Path(__file__).resolve().parents[1]/'references/candidate-batch.schema.json'
SCHEMA=json.loads(SCHEMA_PATH.read_text(encoding='utf-8'))
VERSION=SCHEMA['properties']['schema_version']['const'];MAX_BYTES=2*1024*1024
class ContractError(ValueError):pass

def packed(v):return json.dumps(v,ensure_ascii=False,sort_keys=True,separators=(',',':'),allow_nan=False)
def digest(v):return hashlib.sha256(packed(v).encode()).hexdigest()
def norm(v):return re.sub(r'[^\w\u4e00-\u9fff]','',unicodedata.normalize('NFKC',str(v or ''))).lower()
def strict_loads(raw,*,max_bytes=MAX_BYTES):
 if not isinstance(raw,(str,bytes)) or len(raw.encode() if isinstance(raw,str) else raw)>max_bytes:raise ContractError('JSON超过允许大小；请分批，不要截断候选')
 def pairs(items):
  out={}
  for k,v in items:
   if k in out:raise ContractError('JSON对象包含重复字段：'+k[:60])
   out[k]=v
  return out
 try:v=json.loads(raw,object_pairs_hook=pairs,parse_constant=lambda _:(_ for _ in ()).throw(ContractError('不允许NaN/Infinity')))
 except (json.JSONDecodeError,UnicodeError,RecursionError) as e:raise ContractError('JSON语法错误：'+str(e)[:180]) from None
 def depth(x,n=0):
  if n>35:raise ContractError('JSON嵌套过深')
  if isinstance(x,dict):
   for v in x.values():depth(v,n+1)
  elif isinstance(x,list):
   for v in x:depth(v,n+1)
 depth(v);return v

def validator():
 def deny(uri):raise ContractError('不允许远程Schema引用')
 return Draft202012Validator(SCHEMA,format_checker=FormatChecker(),resolver=RefResolver.from_schema(SCHEMA,store={'':SCHEMA,SCHEMA['$id']:SCHEMA},handlers={'http':deny,'https':deny}))
def pointer(path):return '/'+('/'.join(str(k).replace('~','~0').replace('/','~1') for k in path))
def issue(path,code,message):return {'path':path,'code':code,'message':message}
def date_supported(value,text):
 if not value:return False
 y,m,d=map(int,value.split('-'));return any(v in text for v in [value,f'{y}年{m}月{d}日',f'{y}/{m}/{d}',f'{y}.{m}.{d}'])
def source_key(s):return (s.get('provider'),s.get('record_id') or s.get('url'))
def refs_text(c,sources,key):
 return '\n'.join(e['text'] for ref in c.get(key,[]) for e in sources.get(ref.get('source_id'),{}).get('evidence',[]) if e.get('evidence_id')==ref.get('evidence_id'))
def identity(c):
 e=c['event'];t=e['time'];parts=[norm(e['subject']),norm(e['action']),e['stage'],t['value'],t['precision'],norm(e.get('region')),norm(e.get('reference_period'))]
 if t['precision']=='unknown':parts += [norm(e['fact_summary']),norm(t.get('raw'))]
 return digest(parts)
def content_hash(c,sources):
 # IDs such as S1/E1 are local references; renumbering them is not a content change.
 def evidence(refs):
  return sorted([{'source':source_key(sources[r['source_id']]),'evidence':{k:v for k,v in e.items() if k!='evidence_id'}} for r in refs for e in sources[r['source_id']]['evidence'] if e['evidence_id']==r['evidence_id']],key=packed)
 payload={'event':c['event'],'assessment':c['assessment'],'sources':sorted([{k:v for k,v in sources[s].items() if k not in ['source_id','evidence']} for s in c['source_refs']],key=packed),'fact':evidence(c['fact_evidence_refs']),'date':evidence(c['date_evidence_refs'])}
 return digest(payload)

def inspect_batch(batch,categories=None,*,allow_examples=False):
 out={'version':VERSION,'schema_sha256':hashlib.sha256(SCHEMA_PATH.read_bytes()).hexdigest(),'batch_errors':[],'source_errors':{},'lead_errors':[],'items':[]}
 if not isinstance(batch,dict):out['batch_errors'].append(issue('/','type','批次必须是JSON对象'));return out
 if batch.get('schema_version')!=VERSION:out['batch_errors'].append(issue('/schema_version','version','不支持此版本；支持'+VERSION));return out
 rows=batch.get('candidates');sources=batch.get('sources')
 if not isinstance(rows,list) or not isinstance(sources,list):out['batch_errors'].append(issue('/','required','缺少candidates或sources数组'));return out
 item_errors={i:[] for i in range(len(rows))};bad_sources={}
 for err in validator().iter_errors(batch):
  path=list(err.absolute_path);x=issue(pointer(path),'schema_'+err.validator,'字段不符合契约：'+err.message[:180])
  if len(path)>1 and path[0]=='candidates' and isinstance(path[1],int):item_errors[path[1]].append(x)
  elif len(path)>1 and path[0]=='sources' and isinstance(path[1],int):bad_sources.setdefault(path[1],[]).append(x)
  elif path and path[0]=='unverified_leads':out['lead_errors'].append(x)
  else:out['batch_errors'].append(x)
 if len(rows)>50 or len(sources)>100:return out
 scope=batch.get('scope',{})
 if isinstance(scope,dict) and scope.get('from_date') and scope.get('to_date') and scope['from_date']>scope['to_date']:out['batch_errors'].append(issue('/scope','range','范围起点晚于终点'))
 source_map={};duplicate_sources=set()
 for i,s in enumerate(sources):
  label=s.get('source_id') if isinstance(s,dict) and isinstance(s.get('source_id'),str) else '来源第'+str(i+1)+'项'
  if i in bad_sources:out['source_errors'].setdefault(label,[]).extend(bad_sources[i])
  if not isinstance(s,dict):continue
  sid=s.get('source_id')
  if not isinstance(sid,str):continue
  if sid in source_map:duplicate_sources.add(sid)
  source_map[sid]=s
  if i in bad_sources:continue
  for field in ['published_at','retrieved_at']:
   stamp=s.get(field)
   if stamp is not None:
    try:
     if not re.fullmatch(r'\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})',stamp):raise ValueError()
     parsed_stamp=dt.datetime.fromisoformat(stamp.replace('Z','+00:00'))
     if parsed_stamp.utcoffset() is None:raise ValueError()
    except ValueError:out['source_errors'].setdefault(sid,[]).append(issue(f'/sources/{i}/{field}','datetime','时间须含完整日期、时分秒与时区；只有原始时间文字请填publication_raw，不能猜时区'))
  eids=[e.get('evidence_id') for e in s.get('evidence',[]) if isinstance(e,dict)]
  if len(eids)!=len(set(eids)):out['source_errors'].setdefault(sid,[]).append(issue(f'/sources/{i}/evidence','duplicate_id','同一来源内依据ID重复'))
  u=s.get('url') or ''
  if u:
   try:
    parsed=urlsplit(u)
    if parsed.scheme not in ['http','https'] or not parsed.hostname or parsed.username or parsed.password or re.search(r'[\s<>"\\]',u):raise ValueError()
    parsed.port
   except ValueError:out['source_errors'].setdefault(sid,[]).append(issue(f'/sources/{i}/url','public_url','仅保留不带账号口令的公开HTTP/HTTPS网址或原资料ID'))
  if re.search(r'[?&](?:api[_-]?key|token|secret|signature|access[_-]?key)=',u,re.I):out['source_errors'].setdefault(sid,[]).append(issue(f'/sources/{i}/url','credential_url','不要保存含鉴权信息的临时链接，请用公开地址或原资料ID'))
 for sid in duplicate_sources:out['source_errors'].setdefault(sid,[]).append(issue('/sources','duplicate_id','来源ID重复：'+sid))
 cids=[c.get('candidate_id') for c in rows if isinstance(c,dict) and isinstance(c.get('candidate_id'),str)];duplicate_candidates={cid for cid in cids if cids.count(cid)>1}
 for i,c in enumerate(rows):
  issues=item_errors[i];warnings=[];cid=c.get('candidate_id') if isinstance(c,dict) else None
  if isinstance(cid,str) and cid in duplicate_candidates:issues.append(issue(f'/candidates/{i}/candidate_id','duplicate_id','候选ID重复，不可覆盖前一项'))
  item={'index':i,'candidate_id':cid,'issues':issues,'warnings':warnings,'eligible':False,'can_publish_pending_date':False}
  out['items'].append(item)
  if issues:continue
  if any(sid not in source_map or sid in out['source_errors'] for sid in c['source_refs']):issues.append(issue(f'/candidates/{i}/source_refs','source','来源不存在或来源字段不合格'))
  for key in ['fact_evidence_refs','date_evidence_refs']:
   for j,r in enumerate(c[key]):
    if r['source_id'] not in c['source_refs'] or not any(e.get('evidence_id')==r['evidence_id'] for e in source_map.get(r['source_id'],{}).get('evidence',[])):issues.append(issue(f'/candidates/{i}/{key}/{j}','reference','依据引用不存在或不属于此候选来源'))
  if issues:continue
  a=c['assessment'];e=c['event'];text=refs_text(c,source_map,'fact_evidence_refs')
  if not c['fact_evidence_refs'] or a['evidence_completeness']=='missing':issues.append(issue(f'/candidates/{i}/fact_evidence_refs','missing_evidence','缺少支持具体事件的依据，补齐前不能发布'))
  if a['verification_status']=='conflicting':issues.append(issue(f'/candidates/{i}/assessment/verification_status','conflicting','关键来源冲突，请先核实；不会因为勾选就视为已核实'))
  if not allow_examples and any(source_map[sid]['provider']=='example_only' for sid in c['source_refs']):issues.append(issue(f'/candidates/{i}/source_refs','example_only','这是虚构格式样例，禁止发布为真实卡'))
  kinds=[x['kind'] for r in c['fact_evidence_refs'] for x in source_map[r['source_id']]['evidence'] if x['evidence_id']==r['evidence_id']]
  if kinds and all(k=='tool_summary' for k in kinds):issues.append(issue(f'/candidates/{i}/fact_evidence_refs','tool_summary_only','只有工具总结，需补可追溯材料依据'))
  if categories is not None and e['category'] not in categories:issues.append(issue(f'/candidates/{i}/event/category','category','当前网站没有此分类，请在预览中选择已有分类'))
  if e['stage'] not in ['announcement','communication','decision'] and re.search('预计|有望|或将|拟于|计划自|将于',e['fact_summary']):issues.append(issue(f'/candidates/{i}/event/fact_summary','future_as_fact','预测或未来安排不能写成已实施/已发生，请区分宣布与实施'))
  t=e['time']
  if t['precision']=='day' and (not date_supported(t['value'],refs_text(c,source_map,'date_evidence_refs')) or t['value']>dt.date.today().isoformat()):
   issues.append(issue(f'/candidates/{i}/event/time','date_evidence','日日期缺少明确发生日依据；可明确选择按日期待核发布，保留原提议日期'))
  elif t['precision']!='day':warnings.append('保留'+str(t['value'] or t['raw'] or '未知')+'及原精度；进入日期待核区，不计算日收益')
  if a['tier']=='needs_evidence' or a['open_questions']:warnings.append('保留待核事项；人工选择不代表事实已独立核实')
  if a['verification_status']=='cross_checked' and len({source_key(source_map[s]) for s in c['source_refs']})<2:issues.append(issue(f'/candidates/{i}/assessment/verification_status','cross_check','交叉核对至少要给出不同可追溯来源；当前只有一份'))
  item['can_publish_pending_date']=bool(issues) and all(x['code']=='date_evidence' for x in issues)
  item['eligible']=not issues;item['identity']=identity(c);item['content_hash']=content_hash(c,source_map)
 # Leads have their own lane and never become publishable cards.
 lids=[]
 for i,lead in enumerate(batch.get('unverified_leads',[])):
  if not isinstance(lead,dict):continue
  lid=lead.get('lead_id')
  if isinstance(lid,str):lids.append(lid)
  if isinstance(lead.get('source_refs'),list) and any(not isinstance(s,str) or s not in source_map for s in lead['source_refs']):out['lead_errors'].append(issue(f'/unverified_leads/{i}/source_refs','reference','待核线索来源不存在'))
 if len(lids)!=len(set(lids)):out['lead_errors'].append(issue('/unverified_leads','duplicate_id','待核线索ID重复'))
 return out

def merge_candidates(batch,inspection):
 groups={};sources={s['source_id']:s for s in batch['sources'] if isinstance(s,dict) and isinstance(s.get('source_id'),str)}
 for item in inspection['items']:
  c=batch['candidates'][item['index']]
  key=item.get('identity') or 'invalid:'+str(item['index'])
  if key not in groups:
   groups[key]={'candidate':copy.deepcopy(c),'candidate_ids':[item['candidate_id']],'members':[copy.deepcopy(item)],'issues':copy.deepcopy(item['issues']),'warnings':list(item['warnings'])};continue
  g=groups[key];other=g['candidate'];g['candidate_ids'].append(item['candidate_id']);g['members'].append(copy.deepcopy(item));g['issues'].extend(item['issues']);g['warnings'].extend(item['warnings'])
  for name in ['source_refs','fact_evidence_refs','date_evidence_refs']:
   for v in c[name]:
    if v not in other[name]:other[name].append(copy.deepcopy(v))
  for q in c['assessment']['open_questions']:
   if q not in other['assessment']['open_questions']:other['assessment']['open_questions'].append(q)
  if c['event']['fact_summary']!=other['event']['fact_summary']:
   g['warnings'].append('同事件有不同摘要，全部依据保留；请核对差异')
   a=set(re.findall(r'\d+(?:\.\d+)?',c['event']['fact_summary']));b=set(re.findall(r'\d+(?:\.\d+)?',other['event']['fact_summary']))
   if a and b and not (a<=b or b<=a):g['issues'].append(issue('/candidates','merged_conflict','同事件数值存在差异，来源全部保留，补证前不能发布'))
 for g in groups.values():
  raw_refs=g['candidate'].get('source_refs',[]) if isinstance(g['candidate'],dict) else []
  g['eligible']=not g['issues'];g['can_publish_pending_date']=bool(g['issues']) and all(i['code']=='date_evidence' for i in g['issues']);g['source_count']=len({source_key(sources[s]) for s in (raw_refs if isinstance(raw_refs,list) else []) if isinstance(s,str) and s in sources});g['group_id']=g['candidate_ids'][0] if isinstance(g['candidate_ids'][0],str) else 'invalid-item-'+str(g['members'][0]['index'])
 return list(groups.values())

def select_subset(batch,ids):
 found={c['candidate_id']:c for c in batch['candidates']}
 if not ids or set(ids)-set(found):raise ContractError('未选择候选或候选ID不存在')
 out=copy.deepcopy(batch);out['candidates']=[copy.deepcopy(c) for c in batch['candidates'] if c['candidate_id'] in ids];out['unverified_leads']=[]
 used={sid for c in out['candidates'] for sid in c['source_refs']};out['sources']=[copy.deepcopy(s) for s in batch['sources'] if s['source_id'] in used];return out
