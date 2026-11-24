备份的价值是能在约定的时间内恢复到可接受的数据点。先和团队确定能接受多少数据丢失（RPO）和业务中断（RTO），再决定使用逻辑备份、物理备份和二进制日志的组合。

## 先演练还原，再相信备份

小型 InnoDB 库可以用逻辑导出。`--single-transaction` 为事务表使用一致性快照，导出期间要避免并发 DDL。大库还要评估导出对实例的影响、导入时间和存储成本。要恢复到导出之后的时间点，需要协调备份位置与留存的二进制日志。

```bash
# 逻辑快照。shop_restore 是隔离实例中预建的空库。
mysqldump --login-path=backup --single-transaction --quick \
  --no-tablespaces --set-gtid-purged=OFF shop > shop.sql
mysql --login-path=restore shop_restore < shop.sql
```

这里的两个 login path 是操作机分别为源和恢复实例配置的登录别名，恢复目标需使用隔离实例地址。检查两个命令的退出状态，也要检查恢复后的数据与业务规则。

| 恢复检查 | 约定从样例快照恢复时的预期 |
| --- | --- |
| 行数 | 3 位用户、4 张订单、5 条明细 |
| 连接与金额 | 101 的两条明细合计 128.00，等于订单金额 |
| 关键查询 | 已支付订单为 101、102、104，103 的 `paid_at` 为空 |

## 给每类账号分配最小权限

读列表的账号可授予所需表的 `SELECT`。下单接口只需它读写的表与操作。迁移账号短期持有 DDL 权限，备份和恢复使用独立账号，按具体导出选项和目标需要授权。业务账号不需要全局管理权限，也不应读取备份文件。

## 自测

### 1. 每天凌晨 02:00 全量备份，13:00 故障，没有日志可用，会丢失哪些修改？

<details>
<summary>查看答案</summary>

会丢失快照之后到故障前约 11 小时的修改。若要求最多丢 15 分钟，需要更短的备份间隔或可连续归档和回放的二进制日志，并演练恢复。

</details>

### 2. 恢复后行数相同，能结束验收吗？

<details>
<summary>查看答案</summary>

还要检查约束、典型订单的关联和金额、关键 API 的行为，并记录实际恢复用时。总行数相同无法说明每一行的内容正确。

</details>

## 延伸阅读

- MySQL 8.4 对逻辑导出及各选项所需权限的说明。[mysqldump](https://dev.mysql.com/doc/refman/8.4/en/mysqldump.html)
- MySQL 8.4 的精细授权语法。[GRANT Statement](https://dev.mysql.com/doc/refman/8.4/en/grant.html)
