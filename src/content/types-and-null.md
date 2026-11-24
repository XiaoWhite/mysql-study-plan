字段类型决定数据库能表示哪些值，以及应用如何比较和传输这些值。课程将金额设为 `DECIMAL(10,2)`，将尚未发生的付款时间设为 `NULL`。

## 精确金额和可空字段

`DECIMAL(10,2)` 表示总共最多 10 位数字，其中 2 位在小数点后，最大正值为 `99999999.99`。它适合要求精确小数的金额。也可用整数分，但接口需要约定币种和最小单位，并处理超出 JavaScript 安全整数范围的情况。驱动可以把大整数和小数作为字符串返回，业务应明确金额的序列化和计算方式。

`NULL` 表示未知或缺失。SQL 中 `paid_at = NULL` 的结果是未知，`WHERE` 只保留为真的行。使用 `IS NULL` 查缺失值。样例的 `DATETIME` 不携带时区，应用在边界显式转换为 UTC 再写入。

## 查未付款的订单

```sql
-- IS NULL 匹配尚无付款时间的订单。
SELECT id, total_amount, paid_at IS NULL AS unpaid
FROM orders
WHERE paid_at IS NULL
ORDER BY id;
```

|  id | total_amount | unpaid |
| --: | -----------: | -----: |
| 103 |       129.00 |      1 |

MySQL 在这里用 `1` 表示条件为真。若业务有取消、退款等状态，`paid_at IS NULL` 仍只回答“是否有付款时间”，需要额外根据业务状态筛选。

## 自测

### 1. API 收到金额 `"49.00"`，可以统一转为 `Number` 再做财务计算吗？

<details>
<summary>查看答案</summary>

应保留精确表示，例如传递小数字符串并用十进制库运算，或转成有范围保护的整数分。`49.00` 本身可精确表示，但 JS 浮点数无法精确表示许多含小数的金额。

</details>

### 2. 样例的 `WHERE paid_at <> '2026-03-01 09:02:00'` 会选中哪些订单？

<details>
<summary>查看答案</summary>

选中 102 和 104。101 的付款时间等于给定值，103 的付款时间是 `NULL`，比较结果为未知。若需求要包含 103，需要加 `OR paid_at IS NULL`。

</details>

## 延伸阅读

- MySQL 8.4 精确小数类型及其精度。[Fixed-Point Types](https://dev.mysql.com/doc/refman/8.4/en/fixed-point-types.html)
- MySQL 8.4 对空值比较的说明。[Working with NULL Values](https://dev.mysql.com/doc/refman/8.4/en/working-with-null.html)
