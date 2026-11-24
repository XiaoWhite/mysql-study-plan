上线时即使 SQL 只改一列，也要检查算法、锁和新旧应用版本的兼容性。读副本还需要把复制延迟带入接口设计。

## 分阶段改变表结构

例如新增来源字段。先添加允许为空的字段，让旧版本继续工作，新版本开始写入。若业务需要旧数据有来源，分批回填并监测锁等待与复制延迟。验证所有写路径兼容后，再决定是否加强约束。

```sql
-- 在支持该操作的 MySQL 8.4 InnoDB 样例表上，末尾新增可空列。
-- 显式要求 INSTANT；当前表不支持时直接失败。
ALTER TABLE orders ADD COLUMN source VARCHAR(24) NULL, ALGORITHM=INSTANT;

-- 显式选列避免依赖表的列顺序。
SELECT id, source FROM orders WHERE id = 104;
```

预期读取 `104, NULL`，四张订单和原有字段都保留。即使使用 `INSTANT`，仍需获取元数据锁。长事务可能让变更排队，也可能影响同表的后续请求。上线前用同版本、相近表结构验证支持的算法和锁影响。

## 刚提交的订单为什么读不到？

| 时刻 | 主库 | 副本 | 用户行为 |
| --- | --- | --- | --- |
| T1 | 订单 105 提交成功 | 还未应用这笔事务 | 提交订单 |
| T2 | 已可查询 105 | 尚无 105 | 立即打开详情 |
| T3 | 有 105 | 已追上并返回 105 | 再次读取 |

结账后的第一次详情查询可路由主库，接受短暂延迟的历史列表或报表可用副本。若基础设施能跟踪已提交的事务位置，也可以等待副本应用到指定位置，并设置等待上限。

## 自测

### 1. 为什么新增字段时还要检查旧代码是否用 `INSERT INTO orders VALUES (...)`？

<details>
<summary>查看答案</summary>

它依赖表里每列的位置与数量，新增列后原语句可能失败。先改用显式列名的 INSERT，再新增可空列，让新旧版本可以并存。

</details>

### 2. 下单接口返回 105，详情请求紧接着收到 404，能据此再次创建吗？

<details>
<summary>查看答案</summary>

先确认详情是否读了滞后的副本。用主库或有读己之写保证的读取路径查询。若需要重试下单，要复用原请求键。

</details>

## 延伸阅读

- MySQL 8.4 说明不同 DDL 操作支持的算法和并发行为。[Online DDL Operations](https://dev.mysql.com/doc/refman/8.4/en/innodb-online-ddl-operations.html)
- MySQL 8.4 的复制工作机制。[Replication Implementation](https://dev.mysql.com/doc/refman/8.4/en/replication-implementation.html)
