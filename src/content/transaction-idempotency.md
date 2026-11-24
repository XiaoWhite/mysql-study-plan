事务属于一个数据库连接。对 `connection` 执行 `beginTransaction()` 后，必须用它执行这笔事务中的所有 SQL。`pool.execute()` 可能选中另一个连接，并按自动提交执行。

## 用唯一键保护一次下单

浏览器超时重发时，服务可能已经提交了第一笔订单。客户端用同一个请求键重试。服务端将键按已认证用户隔离，并保存原请求规范化后的摘要。同键同请求返回已有订单，同键不同请求返回冲突。下面把键保存在订单行里。老订单的请求键和摘要保留为空。

```sql
ALTER TABLE orders
  ADD COLUMN request_key VARBINARY(64) NULL,
  ADD COLUMN request_hash BINARY(32) NULL,
  ADD UNIQUE KEY uq_orders_user_request (user_id, request_key);
```

MySQL 的唯一键允许多条空值。新下单接口要求每个请求都提供有效的非空键，应用校验请求键长度，并在服务端对商品、数量等规范化字段计算固定的 32 字节摘要。

## 同一连接完成写入，再处理重试

下面是事务骨架。`insertOrder` 从数据库读取当前报价或校验有效报价，生成待支付订单并写入请求键和摘要。金额按精确小数运算。`deductAndInsertItems` 用第 4 周的条件更新扣库存，检查每次受影响行数，按同一价格快照插入明细。两个函数都只使用传入的 `conn`。`readByKey` 从主库按用户和键查单。

```js
async function createOrder(input) {
  const conn = await pool.getConnection()
  let reusable = true
  try {
    await conn.beginTransaction()
    const orderId = await insertOrder(conn, input)
    await deductAndInsertItems(conn, orderId, input)
    await conn.commit()
    return { orderId }
  } catch (error) {
    try {
      await conn.rollback()
    } catch {
      reusable = false
      conn.destroy()
    }
    throw error
  } finally {
    if (reusable) conn.release()
  }
}

// 在事务之外读已提交记录，避免复用旧快照或占住事务连接。
async function checkout(input) {
  try {
    return await createOrder(input)
  } catch (error) {
    if (error.code !== 'ER_DUP_ENTRY') throw error
    const order = await readByKey(input.userId, input.requestKey)
    if (!order) throw error
    if (!order.requestHash.equals(input.requestHash)) {
      throw new Error('IDEMPOTENCY_CONFLICT') // API 层映射为 409
    }
    return { orderId: order.id }
  }
}
```

| 动作                               | 预期结果                                 |
| ---------------------------------- | ---------------------------------------- |
| 用户 1 以键 `cart-87` 买一张鼠标垫 | 创建待支付订单，可售数由 1 变为 0        |
| 同一个用户用同键同请求重试         | 唯一键已占用，读回第一张订单，不再扣库存 |
| 同一个用户用同键改买两张           | 摘要不同，返回冲突                       |

如果提交时连接断开，客户端不能仅凭错误推断事务失败。用原请求键查主库或按同键重试，才能找回已提交的订单或完成未提交的请求。键的保留期应覆盖可能的重试窗口。

## 自测

### 1. 先查有没有订单，再写订单，是否足够实现幂等？

<details>
<summary>查看答案</summary>

两个并发请求可能都先查到不存在。把唯一约束和库存写入放进同一事务。竞争失败的一方回滚后再读取已提交的订单。

</details>

### 2. `conn.beginTransaction()` 后通过 `pool.execute()` 更新库存，后续 `conn.rollback()` 能撤销扣减吗？

<details>
<summary>查看答案</summary>

不能依赖它。池直接执行的查询可能用另一条连接并独立提交。订单、扣减和明细都要通过同一条事务连接执行。

</details>

## 延伸阅读

- mysql2 的 Promise 连接、池和显式借用 API。[MySQL2 API and Configuration](https://sidorares.github.io/node-mysql2/docs/documentation)
- MySQL 8.4 文档说明唯一索引如何处理空值。[CREATE INDEX Statement](https://dev.mysql.com/doc/refman/8.4/en/create-index.html)
