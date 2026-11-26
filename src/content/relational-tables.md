从订单详情页反推数据模型。用户、订单和商品的生命周期各不相同，一张订单还可以包含多种商品。把这些实体拆成表之后，接口靠键关联它们。

第一次运行本课示例时，在 SQL 客户端选中一个空的练习数据库，展开本页的「电商案例 · 表结构与样例数据」→「查看建表与样例 SQL」，复制并从第一行执行整段初始化脚本，再运行本课的查询。

## 用键表达关系

`users.id` 的主键唯一且非空，能标识一个用户。`orders.user_id` 是外键，要求对应的用户已经存在。同一个用户 ID 可以在订单表出现多次，形成一对多。订单和商品经 `order_items` 形成多对多，明细还记录本次购买的数量和成交单价。

`order_items` 用 `(order_id, line_no)` 作复合主键，行号只需在同一订单内唯一。独立的明细 ID 便于其他表直接引用某条明细，但仍可以用唯一约束防止同一张订单出现两条相同的行号。

## 读一张订单的明细

```sql
-- 用订单 ID 查订单；用同一个 ID 连接它的明细。
SELECT o.id AS order_id, i.line_no, p.name, i.quantity, i.unit_price
FROM orders AS o
JOIN order_items AS i ON i.order_id = o.id
JOIN products AS p ON p.id = i.product_id
WHERE o.id = 101
ORDER BY i.line_no;
```

| order_id | line_no | name   | quantity | unit_price |
| -------: | ------: | ------ | -------: | ---------: |
|      101 |       1 | 键帽   |        1 |      49.00 |
|      101 |       2 | 鼠标垫 |        1 |      79.00 |

接口可将两行组装成一个订单对象和一个 `items` 数组。计算历史订单金额时使用明细的 `unit_price`。若产品改名后还要显示历史名称，也要在下单时保存名称快照。

## 自测

### 1. 两张订单的明细都可以有行号 1 吗？

<details>
<summary>查看答案</summary>

可以。`(101, 1)` 和 `(102, 1)` 是不同的主键。再次插入 `(101, 1)` 则会违反主键约束。

</details>

### 2. 能否插入一条引用订单 999 的明细？

<details>
<summary>查看答案</summary>

样例没有订单 999，启用外键检查时插入会失败。创建订单和明细时，先插入订单，再用它的 ID 插入明细，通常放在同一个事务里。

</details>

## 延伸阅读

- MySQL 8.4 参考手册的外键约束章节说明了父表、子表和引用操作。[FOREIGN KEY Constraints](https://dev.mysql.com/doc/refman/8.4/en/create-table-foreign-keys.html)
