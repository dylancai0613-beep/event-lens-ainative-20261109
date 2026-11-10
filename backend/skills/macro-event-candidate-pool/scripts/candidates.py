"""Offline contract checks, readable pool and selected-subset export. No network."""
import argparse,json,secrets,sys
from pathlib import Path
from candidate_contract import strict_loads,inspect_batch,select_subset,ContractError
TIERS={'priority':'优先考虑','optional':'可选','needs_evidence':'待补证'}
def render(batch):
 s=batch['scope'];lines=['# 候选事件池',f"批次：{batch['batch_id']}",f"检索范围：{s['from_date'] or '未限定'} 至 {s['to_date'] or '未限定'}；扫描状态：{s['scan_state']}",'','## 实际覆盖']
 lines += ['- '+x for x in s['coverage_notes']];lines += ['','停止原因：'+str(s['stop_reason'] or '未记录'),'']
 for c in batch['candidates']:
  e=c['event'];a=c['assessment'];t=e['time'];lines += ['## '+TIERS[a['tier']]+' · '+e['title'],f"候选ID：`{c['candidate_id']}`",f"重要程度：{a['importance']}；证据完整程度：{a['evidence_completeness']}；核实状态：{a['verification_status']}",a['reason'],f"事件日期：{t['value'] or t['raw'] or '未知'}（{t['precision']}）；阶段：{e['stage']}；统计期：{e['reference_period'] or '未提供'}",'','事实摘要：'+e['fact_summary'],'','待核：'+('；'.join(a['open_questions']) or '未单列，仍需核对资料'),'来源：'+', '.join(c['source_refs']),'']
  for src in batch['sources']:
   if src['source_id'] not in c['source_refs']:continue
   lines += [f"- {src['source_id']} · {src['title']} · 资料ID：{src['record_id'] or '无'} · URL：{src['url'] or '未提供'} · 资料发布：{src['publication']['value'] or src['publication_raw'] or '未知'}"]
   for ev in src['evidence']:lines += ['  - '+ev['evidence_id']+' ['+ev['kind']+'] '+ev['text']+'（'+str(ev['locator'] or '位置未记录')+'）']
  lines+=['']
 lines+=['## 单列待核线索（不进入发布）','```json',json.dumps(batch['unverified_leads'],ensure_ascii=False,indent=2),'```','校验不等于事实核实；没有新候选时保留空列表，不凑数量。']
 return '\n'.join(lines)+'\n'
def main():
 p=argparse.ArgumentParser(description=__doc__);sp=p.add_subparsers(dest='command',required=True);nid=sp.add_parser('new-id');nid.add_argument('--kind',choices=['candidate','batch','lead'],default='candidate')
 for name in ['validate','render','select']:
  a=sp.add_parser(name);a.add_argument('file',type=Path)
  if name=='validate':a.add_argument('--report',type=Path)
  else:a.add_argument('--out',required=True,type=Path)
  if name=='select':a.add_argument('--ids',nargs='+',required=True)
 args=p.parse_args()
 if args.command=='new-id':print({'candidate':'cand_','batch':'batch_','lead':'lead_'}[args.kind]+secrets.token_hex(16));return 0
 try:
  batch=strict_loads(args.file.read_text(encoding='utf-8-sig'));check=inspect_batch(batch)
  if args.command=='validate':
   text=json.dumps(check,ensure_ascii=False,indent=2);args.report.write_text(text+'\n',encoding='utf-8') if args.report else print(text)
   return 1 if check['batch_errors'] or check['source_errors'] or check['lead_errors'] or any(i['issues'] for i in check['items']) else 0
  if check['batch_errors'] or check['source_errors'] or any(any(x['code'].startswith('schema_') for x in i['issues']) for i in check['items']):raise ContractError('结构不合格，请先validate定位字段；业务待补证项仍可保留在可读候选池')
  if args.command=='select':
   selected=select_subset(batch,args.ids);args.out.write_text(json.dumps(selected,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
  else:args.out.write_text(render(batch),encoding='utf-8')
  return 0
 except (ContractError,OSError) as e:print(str(e),file=sys.stderr);return 2
if __name__=='__main__':raise SystemExit(main())
