# 来源与覆盖

范围2023-11-09—2026-11-09，范围内部分索引筛选而非全网抓取。49条：国内货币政策17、海外利率9、通胀价格23；首次公开日和时分秒不齐。事件引用状态见[候选池](../evidence/candidates.json)和[数据清单](../evidence/data-inventory.json)；哈希对应构造示意序列，不是行情报价哈希。

本次代表性重开：

|来源|用途|核查结果|
|---|---|---|
|[2024货币政策大事记](https://jrj.sh.gov.cn/SCGK194/20250214/65f4da70183342d08300c459502e0b9d.html)|2/20、7/22、10/21 LPR|支持期限、水平、调整幅度及事件日；事后回顾不证明首次公开时刻|
|[2024-09-18 FOMC](https://www.federalreserve.gov/newsevents/pressreleases/monetary20240918a.htm)|50bp下调|官方声明，14:00 EDT|
|[2024-11-07 FOMC](https://www.federalreserve.gov/newsevents/pressreleases/monetary20241107a.htm)|25bp下调|官方声明，14:00 EST|
|[2024-12-18 FOMC](https://www.federalreserve.gov/newsevents/pressreleases/monetary20241218a.htm)|25bp下调|官方声明，14:00 EST|
|[2023-12-13 FOMC](https://www.federalreserve.gov/newsevents/pressreleases/monetary20231213a.htm)|维持区间|官方声明，14:00 EST|
|[2024-09-09 CPI](https://www.stats.gov.cn/sj/zxfb/202409/t20240909_1956311.html)|8月同比+0.6%|官方页面，09:30|
|[2024-10-13 CPI](https://www.stats.gov.cn/sj/zxfb/202410/t20241013_1956899.html)|9月同比+0.4%|官方页面，09:30|
|[2025-02-09 CPI](https://www.stats.gov.cn/xxgk/sjfb/zxfb2020/202502/t20250209_1958646.html)|1月同比+0.5%|官方公开页|
|[2025-03-09 CPI](https://www.stats.gov.cn/sj/zxfb/202503/t20250309_1958915.html)|2月同比-0.7%|官方页面，09:30|
|2024-08-09旧CPI链接尾号1955948|原库记录|本次404，未用其他页面冒充核实；保持待补证|

资料中的专家解释和未来预测不视为已发生事实。CPI统计月份不充当发布日期；LPR官方年度回顾的2025年资料发布日期不充当2024年事件日。旧卡带record ID的摘录不冒充新抓的一手原文。

## 当前行情数据：明确标注的构造示例

原版行情来自复盘王和服务器现存的指数/黄金序列，并标有 iFinD 字段代码。查到上海黄金交易所官方行情产品说明，明确要求取得交易所或其信息公司许可后方可传播交易信息：[行情产品服务](https://sge.com.cn/sjzx/rzxxs)。本项目没有找到覆盖公开网站、公开 Git 仓库与评审提交包的授权凭据。因此当前发行版已删除该两条市场行情序列，不再声称是实际报价或可供市场分析。

替代值由 `backend/scripts/build-synthetic-market.cjs` 使用固定种子生成：上证指数示意和黄金价格示意各783个数值点，日期轴只是周一至周五，包含非交易日；随机变化独立于事件。序列不带供应商代码，不代表任何标的或交易所报价。UI、报告和结构化数据都标明“构造示例”。哈希与生成参数见 `evidence/data-inventory.json`。此样例不得用于投资分析、收益测算或对任何事件的市场影响解释。

以事为镜的当前发行版只使用构造序列演示日期定位和公式。程序正确性不能验证真实行情质量，因为已不包含真实价格。

## 时间轴扩展的资料

保留原库13条货币政策自然标题和2026年7、8、9月三条消费与工业价格联合发布卡，均显示原库引用待复核，未称已重新抓取全文。

补充两条已打开核对的独立PPI发布：[2024年8月PPI](https://www.stats.gov.cn/sj/zxfb/202409/t20240909_1956310.html)，同比-1.8%、环比-0.7%；[2025年8月PPI](https://www.stats.gov.cn/zwfwck/sjfb/202509/t20250910_1961108.html)，同比-2.9%、环比持平。发布日分别为2024-09-09和2025-09-10。CPI与PPI的统计口径不同，不把二者当作同一个指标。未新增PCE等未收录序列。
