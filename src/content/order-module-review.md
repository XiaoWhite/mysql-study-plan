你收到一份 AI 生成的订单模块方案。用样例数据推演列表与下单路径，然后给出可以验证的改法。假设接口支持多商品订单，用户可以在下单后立即查看详情，超时后客户端会重发。

## 方案摘录

```sql
-- 目标：按用户显示订单列表，每页两张订单并附明细。
SELECT o.id, o.total_amount, i.product_id
FROM orders o JOIN order_items i ON i.order_id = o.id
WHERE o.user_id = ?
ORDER BY o.created_at DESC
LIMIT 2 OFFSET ?;
```

```js
async function createOrder(input) {
  // 从池读取库存，再由应用计算新值。
  const [[stock]] = await pool.execute(
    'SELECT available FROM inventory WHERE product_id = ?', [202],
  )
  if (stock.available < 1) throw new Error('SOLD_OUT')

  const conn = await pool.getConnection()
  await conn.beginTransaction()
  await pool.execute(
    'UPDATE inventory SET available = ? WHERE product_id = ?',
    [stock.available - 1, 202],
  )
  // 假设 insertOrderAndItems 通过 conn 写待支付订单和明细。
  const id = await insertOrderAndItems(conn, input)
  await conn.commit()
  conn.release()
  return id
}
```

方案拟用当前商品价格重新计算历史订单金额，允许订单明细没有外键。计划给 `orders.status` 单独建索引来加速列表，将所有详情读都发往副本。上线时直接增加一个必填的请求键字段，并用业务应用账号运行迁移。

## 自测

### 1. 用户 1 打开第一页会看到哪些订单和明细？列表、价格和索引应怎么改？

<details>
<summary>查看答案</summary>

104 的鼠标垫先出现，随后只返回 101 的商品明细之一。两条 101 明细谁在前没有保证，所以同一个订单可能跨页。全站订单中 103、104 还存在创建时间并列。先按 `created_at DESC, id DESC` 分页取订单主键，再查询这组订单的所有明细，结果应是 104 一条明细和 101 两条明细。连接后显式按订单排序并按行号排序。

历史金额来自成交快照。调高键帽价格后，101 仍应合计 128.00。写入时在同一事务中保存订单总额和明细成交价，外键保证明细指向有效订单与商品。不要用订单状态的单列索引去解决不按状态筛选的列表。评估 `(user_id, created_at, id)`，用代表性参数检查计划、实际行数和排序，再权衡写入成本。

</details>

### 2. 两个请求同时购买最后一张鼠标垫，或第一个请求超时重发，会发生什么？你会怎样上线修正？

<details>
<summary>查看答案</summary>

| 问题 | 影响 | 改法与验证 |
| --- | --- | --- |
| 两个请求都读到可售数 1，再各自把库存写成 0 | 两张订单可能都成功，库存值还看似合法 | 改成带 `available >= ?` 的原子扣减。两请求竞争时应恰好一单成功 |
| 扣减用池，写订单用事务连接 | 扣减可能独立提交。订单失败也会少库存，异常路径还会泄漏连接 | 用一条连接做全部写入，失败时回滚，最后归还或在回滚失败时丢弃。模拟写明细失败，可售数应恢复为 1 |
| 请求没有幂等键 | 在库存充足时，重复提交能创建两单。在库存不足时，用户可能拿不到原订单 | 用户与请求键加唯一约束并核对请求摘要。测试在首次提交后断开，再用同键取回原订单 |
| 刚提交就读副本 | 复制未追上时详情会返回 404 | 结账后的详情读主库或等待副本应用到相应事务。模拟滞后时也应读到已创建的订单 |
| 直接给老表增加必填请求键并共用高权限账号 | 旧订单没有请求键，旧服务还在写入，迁移可能失败或引入无意义默认键 | 先加入可空列并验证唯一键和 DDL 算法，部署保证新订单带键的服务，再按业务需要决定是否回填。使用单独的迁移账号，在隔离环境演练回滚和恢复 |

重试仅针对可恢复故障，从一笔新事务开始。它使用同一请求键，并保持事务外的支付操作幂等。

</details>

## 延伸阅读

- 回看本手册的[连接和结果行数](#/lesson/joins)、[条件扣库存与死锁重试](#/lesson/locks-deadlocks)和[迁移与复制延迟](#/lesson/migrations-replication)。
