---
name: macro-event-candidate-pool
description: 从可访问资料整理宏观与资产研究候选事件，宽筛分层、合并同事件来源并输出复盘王兼容JSON；适用于先人工选择、再由网站管理员预览发布的流程。不负责登录网站或自动发布。
---

# 候选事件池

先读 `references/rules.md`；唯一数据契约是 `references/candidate-batch.schema.json`。不要读取网站配置、密钥或私人研究。

## 工作步骤

1. 确认用户给定的日期范围、主题和可用来源。通过当前客户端已提供的工具能力说明核实可访问来源、分页和时间筛选；工具名称与安装位置见 `references/clients.md`。没有访问的来源不得宣称覆盖。未要求获取时，只整理用户提供或获准读取的材料。
2. 按资料正文找具体行动、宣布、决定、实施、数据发布或风险发生。将事实、解释和预测分开。正式宣布未来计划本身可以是事件，不能改写成已经实施。不要求行情已反应、因果已证实或日期齐全。无具体事件的纯评论排除；未证实但重要的线索单列 `unverified_leads`。
3. 将同一主体、行动、阶段、时间节点与统计期的资料归为同一事件，合并全部来源和依据。宣布与实施、不同数据统计期不得混为一件。标题相同不能直接判重。保留数值、日期等冲突，不替用户裁决。
4. 分为“优先考虑 / 可选 / 待补证”，分别给出重要程度、证据完整程度、核实状态和简短理由。缺非关键字段不淘汰。有具体事实但日期不完整，仍保留；缺事实依据或关键冲突标为待补证且不宣称可发布。详细发布门槛见规则。
5. 生成稳定随机候选ID（`cand_`加32位小写十六进制）。同一批重试或选中子集沿用ID；另一事实使用新ID。批次ID同理。依据按原文摘录并标明位置、资料ID或真实公开URL。没有URL用null；不把工具总结装成原文，不编造引用。只明确到月/年就保留精度，未知为null；资料发布日期、统计期、宣布日和实施日分开。
6. 同时交付可读Markdown和原格式JSON，候选ID完全一致。每批说明日期、实际来源、覆盖缺口及是否扫完。JSON不含正式卡ID、操作者、发布时刻、行情收益等网站生成字段；候选评语仅在assessment，不能混成事实摘要。
7. 用 `scripts/candidates.py validate batch.json` 校验；失败时按候选和字段修正，不能删掉有价值候选来让格式通过。用 `render`生成可读清单。用户选中后用 `select`输出同格式子集，无须用户改字段。校验通过仅说明格式/必要引用合格，不代表事实已核实或筛选质量合格。

## 本地命令

Python需安装 `jsonschema==4.17.3`（采用已测试版本；不需API）。所有命令仅处理本地文件，不访问网络。

```text
python scripts/candidates.py new-id
python scripts/candidates.py validate batch.json --report validation.json
python scripts/candidates.py render batch.json --out candidates.md
python scripts/candidates.py select batch.json --ids cand_... cand_... --out selected.json
```

引用路径按本Skill目录解析。把选中子集原样粘贴到网站“全部事件卡 → 导入候选事件”，由管理员校验、预览、勾选和确认。本Skill不自动登录、上传、发布或安装自己。客户端没有脚本工具时交付JSON并说明尚未机器校验，不虚报通过。
