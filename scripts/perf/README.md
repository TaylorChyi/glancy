# 压测脚本清单（Glancy Performance）

本文档列举第 16 章（端到端性能与容量规划）中要求的压测脚本与推荐执行参数，供压测与发布门禁时引用。

## 场景总览

| 编号 | 场景说明             | 脚本文件                      | 工具/运行命令示例 |
| ---- | -------------------- | ----------------------------- | ----------------- |
| P1   | 流式查词稳态（S1）   | `lookup_steady.jmx`           | `jmeter -n -t lookup_steady.jmx -Jtarget_qps=300` |
| P2   | 流式查词突发（S2）   | `lookup_spike.gatling`        | `mvn gatling:test -Dgatling.simulationClass=LookupSpikeSimulation` |
| P3   | 上游异常降级（S3）   | `lookup_upstream_fault.jmx`   | `jmeter -n -t lookup_upstream_fault.jmx -Jfault_rate=0.05` |
| P4   | 再生成降级稳态       | `regenerate_degraded.locustfile` | `locust -f regenerate_degraded.locustfile --users 120 --spawn-rate 30` |
| P5   | 导出任务 RTO         | `export_task_rto.py`          | `locust -f export_task_rto.py --headless -u 10 -r 2` |
| P6   | 订阅更新推送         | `subscription_push.ts`        | `k6 run subscription_push.ts --vus 200 --duration 5m` |

> 文件采用 Git LFS 之外的普通文本格式（JMX/Gatling/Locust/k6）。若需生成示例，可参照 `scripts/perf/templates/`。实际压测前请根据环境变量替换域名、认证信息与 payload。

## 输出与留痕

1. 所有脚本执行需带上 `--tags release=YYYYMMDD` 或等效参数，以便将指标回填至 APM。
2. 压测完成后导出以下内容，与第 16 章 16.10.3 中的报表模板对应：
   - 指标汇总 CSV/JSON（端到端 P50/P95、错误率、命中率、Burn Rate 等）。
   - 上游并发曲线截图、Redis/队列监控截图。
   - 降级/熔断触发时间线（来自 BFF 日志或监控事件）。
3. 报告归档在团队知识库《性能压测》空间，同时同步第 10 章配额/限流变更记录。

## 注意事项

- 压测流量需落在专用白名单租户，避免影响真实用户；压测租户的限速参数默认与生产一致。
- 执行前确认缓存预热脚本运行完毕，避免因冷启动导致指标偏差。
- 若需要调整脚本或参数，请更新本清单并在 MR 中同步第 16 章表格。

