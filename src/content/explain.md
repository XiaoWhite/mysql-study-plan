执行计划描述 MySQL 如何读表、用哪个索引、以什么顺序连接以及如何排序。排查慢查询时，先收集原 SQL、参数分布、响应时间、行数和等待信息，再对照计划。

## 估算和实测分别回答什么？

`EXPLAIN FORMAT=TRADITIONAL` 里的 `key` 是选中的索引，`rows` 是估算每次扫描检查的行数，`filtered` 是估算的保留比例。`Using filesort` 表示需要额外排序，排序可在内存或磁盘完成。`EXPLAIN ANALYZE` 会实际运行查询，并报告各迭代器的实际行数、时间和循环次数，应在受控环境对代表性的查询执行。

## 对比用户订单列表

假设已创建上一课的 `idx_orders_user_created_id`。

```sql
-- 先看计划选了什么；下面的 ANALYZE 会实际执行 SELECT。
EXPLAIN FORMAT=TRADITIONAL
SELECT id, created_at FROM orders
WHERE user_id = 1
ORDER BY created_at DESC, id DESC LIMIT 2;

EXPLAIN ANALYZE
SELECT id, created_at FROM orders
WHERE user_id = 1
ORDER BY created_at DESC, id DESC LIMIT 2;
```

数据本身的结果始终是 104、101。下面两种计划特征都可解释，具体输出取决于统计信息与成本估算。

| 观察 | 如何理解 |
| --- | --- |
| 选联合索引，筛到用户 1 并按键反向读取 | 可从索引里取到所需列，并利用键顺序 |
| 显示 `type=ALL` 和 `Using filesort` | 小表扫描再排序可能更便宜。用接近生产数据量和用户分布的数据复测 |

如果估算与实际行数差距大，检查统计信息和数据偏斜。如果查询读行很少但耗时波动大，检查锁等待、连接池排队和网络耗时。

## 自测

### 1. `possible_keys` 里出现某个索引，能说明已经使用它吗？

<details>
<summary>查看答案</summary>

`possible_keys` 是优化器考虑过的候选。用 `key` 或树形计划的访问节点确认实际选择。

</details>

### 2. 有 `Using filesort` 就应该加索引吗？

<details>
<summary>查看答案</summary>

要看排序输入行数、频率和实际耗时。几行排序通常很便宜，加索引会让每次写入都付出成本。

</details>

## 延伸阅读

- MySQL 8.4 解释计划字段和 `EXPLAIN ANALYZE`。[EXPLAIN Statement](https://dev.mysql.com/doc/refman/8.4/en/explain.html)
