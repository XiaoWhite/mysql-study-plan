联合索引把多个列排成一组有序的键。设计时从真实的高频查询出发，检查等值条件、范围条件、排序和返回列。以 `(user_id, created_at, id)` 为例，同一个用户的订单相邻，再按创建时间和 ID 排序。

## 最左前缀与覆盖

按 `user_id` 或 `user_id + created_at` 查，能直接定位到索引中的一段。只按创建时间查全站订单时，普通的最左前缀范围定位用不上这个索引，优化器仍可能选择扫描索引或其他访问方式。若全站时间线是高频需求，应单独评估以 `created_at` 开头的索引。

若索引能提供查询用到的全部列，它覆盖了该查询。增加列能覆盖更多查询，也会增加空间与写入成本。InnoDB 会在二级索引记录附带主键，示例显式列出 `id` 来表达排序规则。

## 查询用户 1 的近期订单

```sql
-- user_id 等值过滤之后，索引可沿 created_at、id 反向读。
CREATE INDEX idx_orders_user_created_id
  ON orders (user_id, created_at, id);

SELECT id, created_at
FROM orders
WHERE user_id = 1 AND created_at >= '2026-03-01 09:00:00'
ORDER BY created_at DESC, id DESC
LIMIT 2;
```

| id | created_at |
| ---: | --- |
| 104 | 2026-03-01 10:00:00 |
| 101 | 2026-03-01 09:00:00 |

索引提供筛选列和投影列。若添加 `total_amount` 到投影，当前索引仍可能帮忙筛选和排序，但读取金额通常要回表。

## 自测

### 1. 查询增加 `SELECT total_amount`，是否应该立即把金额加到索引末尾？

<details>
<summary>查看答案</summary>

先看每次查询命中多少行、该接口有多热、回表时间是否显著。每次只取两条时，多维护一个宽索引可能不划算。

</details>

### 2. 以该索引查询所有用户的订单，能直接得到全站的时间顺序吗？

<details>
<summary>查看答案</summary>

索引先按用户排列，跨多个用户时它没有按全站时间顺序排列。取消用户等值筛选后，应检查计划是否需要额外排序，并按需要评估以时间开头的索引。

</details>

## 延伸阅读

- MySQL 8.4 介绍联合索引可用于定位的前缀。[Multiple-Column Indexes](https://dev.mysql.com/doc/refman/8.4/en/multiple-column-indexes.html)
- MySQL 8.4 说明可利用索引排序的条件。[ORDER BY Optimization](https://dev.mysql.com/doc/refman/8.4/en/order-by-optimization.html)
