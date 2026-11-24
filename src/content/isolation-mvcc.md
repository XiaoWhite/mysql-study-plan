多版本并发控制（MVCC）让普通查询读取符合快照的旧版本，读和写通常无需互相等待。理解事务结果时，要区分普通 `SELECT`、锁定读和更新。

## 什么时候建立快照？

| 隔离级别                  | InnoDB 普通 SELECT 的典型行为                                |
| ------------------------- | ------------------------------------------------------------ |
| `READ UNCOMMITTED`        | 可以读到未提交的修改                                         |
| `READ COMMITTED`          | 每条一致性读使用新的快照，可看到此前已提交的修改             |
| `REPEATABLE READ`（默认） | 同一个事务中的一致性读复用第一次一致性读建立的快照           |
| `SERIALIZABLE`            | 显式事务中，普通 SELECT 通常隐式变成共享锁定读，增加等待机会 |

报表需要多条查询共用快照时，可以用 `REPEATABLE READ` 的一致性读。实时列表希望后续读尽量看到刚提交的变化时，`READ COMMITTED` 更直观。库存决策需要写入时的行状态，应使用带条件的更新或合适的锁定读。

## 两个连接看同一条库存

会话 A 用 `REPEATABLE READ` 并保持事务开启，B 在独立事务里更新。商品 202 初始可售数为 1。

| 步骤 | 会话 A                                                 | 会话 B                |
| ---- | ------------------------------------------------------ | --------------------- |
| 1    | `START TRANSACTION`，普通 SELECT 看到 1                |                       |
| 2    |                                                        | 更新可售数为 0 并提交 |
| 3    | 同样的普通 SELECT 仍看到 1                             |                       |
| 4    | `SELECT ... FOR UPDATE` 看到当前已提交值 0，并锁定记录 |                       |
| 5    | A 回滚或提交，释放锁                                   |                       |

```sql
-- 普通读在 A 的两次执行中复用快照。
SELECT available FROM inventory WHERE product_id = 202;

-- 锁定读在显式事务中查看当前行，锁保留到事务结束。
SELECT available FROM inventory WHERE product_id = 202 FOR UPDATE;
```

两次普通读复用快照需要这两次使用同一个连接上的同一事务。`SELECT ... FOR UPDATE` 读取当前行，在并发写未提交时可能等待。

## 自测

### 1. 若 A 用 `READ COMMITTED`，步骤 3 的普通查询返回什么？

<details>
<summary>查看答案</summary>

返回 0。B 已提交，每条一致性读创建自己的快照。

</details>

### 2. 步骤 3 后，A 能用快照中的 1 直接决定成功下单吗？

<details>
<summary>查看答案</summary>

应让写入语句同时验证和扣减库存，例如 `UPDATE ... WHERE product_id = 202 AND available >= 1`。在本时序中它匹配 0 行，接口应取消下单。

</details>

## 延伸阅读

- MySQL 8.4 关于一致性读的快照规则。[Consistent Nonlocking Reads](https://dev.mysql.com/doc/refman/8.4/en/innodb-consistent-read.html)
- MySQL 8.4 四种事务隔离级别及锁行为。[Transaction Isolation Levels](https://dev.mysql.com/doc/refman/8.4/en/innodb-transaction-isolation-levels.html)
