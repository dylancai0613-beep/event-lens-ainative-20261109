# 来源与覆盖

范围2023-11-09—2026-11-09，范围内部分索引筛选而非全网抓取。49条：国内货币政策17、海外利率9、通胀价格23；首次公开日和时分秒不齐。详细条目、引用状态和报价哈希见evidence/data-inventory.json、candidates.json及dist/data.json。

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

行情只读取得原复盘王现存发布快照，服务器版本ifind-http_20261105_173028，market generation 20261109_080002_8804b8；未运行供应商请求/更新任务。基础文件是replay-studio-data.js中两资产，增量只导出000001.SH与S000025544的series字段和公开status摘要。没有私人文档、模型回执、密钥和数据库。

独立交叉核验全部1433个价格尚未完成；本次检验的是来源链、日期顺序、价格合法性、窗口一致性与确定性计算。原数据提供商的再分发条款未证明：本次仅使用用户授权的笔试演示快照，不宣称开放数据许可或真实交易可用性。商业版需获授权数据接入和数据质量验收。

## 时间轴扩展的资料

保留原库13条货币政策自然标题和2026年7、8、9月三条消费与工业价格联合发布卡，均显示原库引用待复核，未称已重新抓取全文。

补充两条已打开核对的独立PPI发布：[2024年8月PPI](https://www.stats.gov.cn/sj/zxfb/202409/t20240909_1956310.html)，同比-1.8%、环比-0.7%；[2025年8月PPI](https://www.stats.gov.cn/zwfwck/sjfb/202509/t20250910_1961108.html)，同比-2.9%、环比持平。发布日分别为2024-09-09和2025-09-10。CPI与PPI的统计口径不同，不把二者当作同一个指标。未新增PCE等未收录序列。
