InnoDB 把行放在聚簇索引的叶子页里。在样例中，`orders` 以 `id` 为主键，按该键组织聚簇索引。主键范围查询可以沿着相邻的键读行。

## 读二级索引时访问了什么？

二级索引的记录包含索引列和定位聚簇记录所需的主键列。外键 `orders.user_id` 需要子表索引，如果没有合适的索引，InnoDB 会创建一个。按 `user_id` 找到订单主键后，读取 `total_amount` 通常还需要访问聚簇记录，这一步常叫回表。

二级索引能加快选择性高的读操作。每写入一行也要维护关联索引，主键越宽，每个二级索引要携带的信息也越多。挑选主键时要兼顾稳定性、宽度和写入方式。

## 推演按用户查订单

```sql
-- 外键支持索引可提供 user_id 与 id；金额来自订单行。
SELECT id, total_amount
FROM orders
WHERE user_id = 1
ORDER BY id;
```

|  id | total_amount |
| --: | -----------: |
| 101 |       128.00 |
| 104 |        79.00 |

若使用 `user_id` 的二级索引，可先找到 101 和 104，再取两行金额。只有四条记录时，优化器也可能选择扫描整表。实际计划以 `EXPLAIN` 为准。

## 自测

### 1. 将投影改成 `SELECT id`，二级索引能提供这个值吗？

<details>
<summary>查看答案</summary>

能。InnoDB 的二级索引已携带主键。若优化器选择该二级索引，查询所需列都在索引里。是否选择它取决于代价估计。

</details>

### 2. 把订单主键改为很长的字符串会影响什么？

<details>
<summary>查看答案</summary>

主键更宽，二级索引中随记录存放的主键也更宽。相同数量的行可能占据更多页，加大缓存和 I/O 压力。是否值得取决于业务的唯一性需求和实际负载。

</details>

## 延伸阅读

- MySQL 8.4 对 InnoDB 两类索引结构的说明。[Clustered and Secondary Indexes](https://dev.mysql.com/doc/refman/8.4/en/innodb-index-types.html)
