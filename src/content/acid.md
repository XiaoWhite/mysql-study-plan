创建订单时，扣库存、写订单和写明细要作为一个业务动作完成。InnoDB 事务把这些修改放进同一个提交边界。客户端成功收到 `COMMIT` 响应后，才应返回订单已创建。

## 从订单接口理解 ACID

| 性质 | 电商中的含义 |
| --- | --- |
| 原子性 Atomicity | 库存和订单修改一起提交，失败时一起回滚 |
| 一致性 Consistency | 提交前后都应满足数据规则，如库存不能为负。应用仍须正确表达业务规则 |
| 隔离性 Isolation | 并发事务彼此可见的内容与互相等待的行为，由隔离级别和语句类型决定 |
| 持久性 Durability | 成功提交的修改按数据库的持久化配置保存，故障恢复依赖相关日志与配置 |

MySQL 默认开启自动提交。扣库存和写订单若分成两次独立提交，订单失败时已提交的扣减无法用该请求后续的 `ROLLBACK` 撤销。

## 推演一次失败的写入

```sql
START TRANSACTION;

-- 样例中 SKU 202 剩 1 件，此语句匹配并修改一行。
UPDATE inventory SET available = available - 1
WHERE product_id = 202 AND available >= 1;

-- 用户 999 不存在，INSERT 因外键失败。
INSERT INTO orders (user_id, status, total_amount, created_at)
VALUES (999, 'PENDING', 79.00, UTC_TIMESTAMP());

-- 应用捕获失败后显式回滚，再释放连接。
ROLLBACK;
```

回滚后商品 202 的可售数仍是 1，不会留下任何新订单。这里的外键错误通常只回滚失败的语句，应用负责回滚整笔事务。自增 ID 可能出现空洞，回滚后不用复用。

## 自测

### 1. 两条语句都在默认自动提交模式下执行，订单失败后库存是多少？

<details>
<summary>查看答案</summary>

是 0。第一条语句已经独立提交。用显式事务让失败分支同时回滚库存更新。

</details>

### 2. 扣库存语句成功执行但修改了 0 行，可以继续创建订单吗？

<details>
<summary>查看答案</summary>

不可以。更新成功执行与库存扣减成功是两件事。判断 `affectedRows`，缺货或 SKU 没有库存记录时应回滚并返回业务错误。

</details>

## 延伸阅读

- MySQL 8.4 对事务开始、提交和回滚的定义。[START TRANSACTION, COMMIT, and ROLLBACK](https://dev.mysql.com/doc/refman/8.4/en/commit.html)
