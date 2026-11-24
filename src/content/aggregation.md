`GROUP BY` 用一组键决定每个输出行代表什么。`COUNT`、`SUM` 等聚合函数再把组内多行变成数值。审阅汇总 SQL 时，数清楚进入每个组的行。

## 选择正确的计数口径

`COUNT(*)` 计算组里的每行，包括左连接补出的空行。`COUNT(o.id)` 只计算已匹配的订单。`SUM(o.total_amount)` 在一组里没有任何非空金额时返回 `NULL`，用 `COALESCE` 将“没有匹配金额”归为 0。`HAVING` 对分组结果过滤，`WHERE` 在分组前过滤输入。

## 每位用户的已支付金额

```sql
-- 保留无付款单的用户；每张订单在此只参加一次聚合。
SELECT u.id AS user_id, COUNT(o.id) AS paid_orders,
       COALESCE(SUM(o.total_amount), 0) AS paid_total
FROM users AS u
LEFT JOIN orders AS o ON o.user_id = u.id AND o.status = 'PAID'
GROUP BY u.id
ORDER BY u.id;
```

| user_id | paid_orders | paid_total |
| ---: | ---: | ---: |
| 1 | 2 | 207.00 |
| 2 | 1 | 49.00 |
| 3 | 0 | 0.00 |

接上明细后，同一笔订单金额可能输入多次。`COUNT(DISTINCT o.id)` 可以修正订单计数。`SUM(DISTINCT o.total_amount)` 会合并不同订单的相同金额，不能用于修正订单合计。需要按订单粒度先汇总，或者直接对每条明细的 `quantity * unit_price` 求和。

## 自测

### 1. 在原查询中改用 `COUNT(*)`，用户 3 的订单数显示多少？

<details>
<summary>查看答案</summary>

显示 1，因为左连接为用户 3 保留了一条记录。用主键 `COUNT(o.id)` 才能在没有匹配时得到 0。

</details>

### 2. 能直接在原查询的 SELECT 中加入 `o.id AS sample_order_id` 吗？

<details>
<summary>查看答案</summary>

MySQL 8.4 默认启用 `ONLY_FULL_GROUP_BY`，会拒绝该写法。用户 1 的付款订单有 101 和 104，分组键无法唯一决定订单 ID。如果要展示最近一单，可以在子查询用按 `created_at DESC, id DESC` 排序的 `ROW_NUMBER()` 选出每位用户的第一条，再连接汇总结果。

</details>

## 延伸阅读

- MySQL 8.4 的聚合函数和空值行为。[Aggregate Function Descriptions](https://dev.mysql.com/doc/refman/8.4/en/aggregate-functions.html)
- MySQL 8.4 检查分组中的函数依赖。[MySQL Handling of GROUP BY](https://dev.mysql.com/doc/refman/8.4/en/group-by-handling.html)
