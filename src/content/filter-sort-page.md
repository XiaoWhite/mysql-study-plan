订单列表的三个问题是筛选哪些行、怎样排列、下一页从哪里接上。先确定排序，再选择分页方式。

## 用唯一键打破并列

`WHERE` 决定可见行，`ORDER BY` 决定展示顺序，`LIMIT` 决定一页取几行。样例订单 103、104 同时创建，只按 `created_at DESC` 排序时，两条的相对顺序没有保证。再按唯一的 `id DESC` 排序可以消除并列。

`LIMIT 2 OFFSET 2` 容易实现跳页，但前面插入或删除记录可能导致重读或漏读。使用游标时，前端保存上一页最后一行的两个排序值。对于同一个筛选条件，下一页只取排在游标之后的记录。

## 推演两页结果

```sql
-- 首页：固定排序规则。
SELECT id, created_at
FROM orders
ORDER BY created_at DESC, id DESC
LIMIT 2;

-- 下一页：游标来自首页最后一行 (10:00, 103)。
SELECT id, created_at
FROM orders
WHERE created_at < '2026-03-01 10:00:00'
   OR (created_at = '2026-03-01 10:00:00' AND id < 103)
ORDER BY created_at DESC, id DESC
LIMIT 2;
```

| 页面   | 订单 ID，从前到后 |
| ------ | ----------------- |
| 第一页 | 104、103          |
| 第二页 | 102、101          |

游标适合连续向下读。它避免在游标之前插入新行导致的偏移，但若修改结果集里的排序字段或筛选字段，行仍可能移动。想做一致性导出时，单独定义快照或数据边界。

## 自测

### 1. 若第一页只返回 104 且游标只有创建时间，用 `created_at < 游标时间` 会怎样？

<details>
<summary>查看答案</summary>

103 同样在 10:00 创建，会被跳过。游标要带上 ID，并按排序方向比较两个字段。

</details>

### 2. 再加上 `status = 'PAID'` 后，按相同排序取第一页会得到什么？

<details>
<summary>查看答案</summary>

104、102。103 仍为待付款，即使时间更新也不符合条件。将状态和游标条件组合时，要把整个含 `OR` 的游标条件放进一对括号中。

</details>

## 延伸阅读

- MySQL 8.4 说明了 `LIMIT` 和具有并列值的 `ORDER BY`。[LIMIT Query Optimization](https://dev.mysql.com/doc/refman/8.4/en/limit-optimization.html)
