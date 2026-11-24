审阅 `JOIN` 时先说清楚结果每行代表什么。订单列表默认一行一张订单，订单详情经常需要一行一条明细。

## 连接如何增减结果行

`INNER JOIN` 只保留满足连接条件的配对。`LEFT JOIN` 保留每条左表记录。左边没有匹配时，右表字段补为 `NULL`。若一条左记录匹配右边两条记录，两种连接都会产生两行。若只想检查是否有符合条件的订单，可以使用 `EXISTS`，让外层保留每位用户一行。

## 保留没有付款订单的用户

```sql
-- PAID 是“匹配哪条订单”的条件，所以写在 ON 中。
SELECT u.id AS user_id, o.id AS order_id
FROM users AS u
LEFT JOIN orders AS o ON o.user_id = u.id AND o.status = 'PAID'
ORDER BY u.id, o.id;
```

| user_id | order_id |
| ------: | -------: |
|       1 |      101 |
|       1 |      104 |
|       2 |      102 |
|       3 |   `NULL` |

若把 `o.status = 'PAID'` 移到 `WHERE`，用户 3 的补空行也会被过滤。若报表确实只显示有付款单的用户，则先考虑 `EXISTS`，避免额外返回订单列和重复用户。

## 自测

### 1. 四张样例订单与 `order_items` 用订单 ID 内连接后有几行？

<details>
<summary>查看答案</summary>

五行。101 匹配两条明细，其余三张订单各匹配一条。对这五行直接分页按明细计数，可能切开同一张订单。

</details>

### 2. 怎样显示每页两张订单和它们的全部明细？

<details>
<summary>查看答案</summary>

先对 `orders` 排序并取两张，再连接这两张订单的明细。可以用 CTE 或派生表在同一语句中完成。外层仍需明确排序，比如按订单创建时间和 ID 倒序，随后按每单行号升序。

</details>

## 延伸阅读

- MySQL 8.4 的连接语法与补空规则。[JOIN Clause](https://dev.mysql.com/doc/refman/8.4/en/join.html)
