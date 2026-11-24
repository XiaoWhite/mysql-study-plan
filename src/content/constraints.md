应用校验能给用户及时反馈，数据库约束则能在脚本、后台任务和并发请求写入时守住共享规则。选择约束时先写出要保护的业务条件。

## 明确谁负责哪条规则

| 规则                     | 样例做法                        | 取舍                                                   |
| ------------------------ | ------------------------------- | ------------------------------------------------------ |
| 一个 SKU 对应一个商品    | `NOT NULL UNIQUE`               | 先决定 SKU 是否区分大小写，唯一比较受字符排序规则影响  |
| 一条明细必须指向现有订单 | 外键 `order_items.order_id`     | 删除订单时须明确保留历史还是级联清理                   |
| 数量必须大于零           | `NOT NULL CHECK (quantity > 0)` | `CHECK` 对未知值允许通过，需要 `NOT NULL` 一起表达必填 |
| 订单总额等于明细合计     | 同一事务写订单和明细，定期核对  | 跨行规则不能用单表的 `CHECK` 表达                      |

MySQL 8.4 会执行普通的 `CHECK` 约束。旧项目从早于 8.0.16 的版本迁移时，要留意过去被接受但没有执行的 `CHECK`。

## 为付款状态加一条约束

```sql
-- 样例只有 PENDING 与 PAID，四条现有记录全都满足该规则。
ALTER TABLE orders
  ADD CONSTRAINT chk_orders_paid_time CHECK (
    (status = 'PAID' AND paid_at IS NOT NULL)
    OR (status = 'PENDING' AND paid_at IS NULL)
  );

-- 103 的 paid_at 仍为空。执行结果：违反约束，订单保持 PENDING。
UPDATE orders SET status = 'PAID' WHERE id = 103;
```

若要把 `103` 标记为已支付，在同一条更新语句写入状态和付款时间。新增退款等状态时，先确定退款单是否仍要保留付款时间，再调整约束与写入路径。

## 自测

### 1. 为可空字段加 `UNIQUE`，能限制表里只存在一个 `NULL` 吗？

<details>
<summary>查看答案</summary>

不能。MySQL 的唯一索引允许多个 `NULL`。若想每条商品记录都有一个已知且不重复的 SKU，需要同时声明 `NOT NULL` 和 `UNIQUE`。

</details>

### 2. 为什么不能通过更新商品 `price` 来更新历史订单金额？

<details>
<summary>查看答案</summary>

历史订单反映成交时的价格。更新 `products.price` 只影响后续报价。旧单从 `order_items.unit_price` 读取历史单价，`orders.total_amount` 用同一次下单事务保存当时的总额。

</details>

## 延伸阅读

- MySQL 8.4 对 `CHECK` 表达式及检查时机的规定。[CHECK Constraints](https://dev.mysql.com/doc/refman/8.4/en/create-table-check-constraints.html)
