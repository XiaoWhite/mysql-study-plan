用 `execute(sql, values)` 把数据值传给预处理语句。应用仍负责验证业务参数和调用者权限，例如用户只能访问自己的订单。

## 值和 SQL 结构分开

`?` 可以绑定订单 ID、状态等值。列名和排序方向属于 SQL 结构，动态选择时，从程序定义的选项中取固定片段。无效参数在执行前拒绝，查询没找到记录返回业务层的未找到，数据库不可用按服务错误处理。日志记录错误分类和请求标识，面向客户端的响应不包含内部 SQL 或连接凭据。

## 借出连接并始终释放

例子用第 5 周第一课的 `pool`。调用方已验证 ID 格式，`userId` 从登录态取得。独立查询实际可以直接用 `pool.execute`，此处展示手动借用时的清理边界。

```js
async function getOrder(orderId, userId) {
  const connection = await pool.getConnection()
  try {
    const [rows] = await connection.execute(
      `SELECT CAST(id AS CHAR) AS id, status, total_amount
         FROM orders WHERE id = ? AND user_id = ?`,
      [orderId, userId],
    )
    return rows[0] ?? null
  } finally {
    // 找不到记录和执行失败也要归还池。
    connection.release()
  }
}
```

| 调用                   | 结果                                        |
| ---------------------- | ------------------------------------------- |
| `getOrder('104', '1')` | 返回 104，金额 `"79.00"`                    |
| `getOrder('104', '2')` | 返回 `null`，用户 2 无法读取用户 1 的订单   |
| 执行失败               | Promise 拒绝，已借用的连接走 `finally` 清理 |

如果当前连接开启了事务，应在释放前提交或回滚。回滚失败时丢弃连接，避免其他请求借到状态不明的会话。

## 自测

### 1. `ORDER BY ?` 能用来把请求里的 `sortBy` 绑定为列名吗？

<details>
<summary>查看答案</summary>

占位符绑定的是值。定义允许的选项，如把 `'recent'` 映射到固定的 `created_at DESC, id DESC`，然后选择对应的预定义 SQL。

</details>

### 2. `pool.getConnection()` 就失败时，也应在 `finally` 里释放吗？

<details>
<summary>查看答案</summary>

没有借到连接就没有可释放的对象，直接让错误传播。将 `try/finally` 放在获取成功之后，确保后续所有路径释放同一个连接。

</details>

## 延伸阅读

- mysql2 的 `execute` 和参数类型说明。[Prepared Statements](https://sidorares.github.io/node-mysql2/docs/documentation/prepared-statements)
