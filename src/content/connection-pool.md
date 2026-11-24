`mysql2/promise` 把连接和查询暴露为 Promise 接口。连接池让多个请求复用固定数量的数据库连接。同一个 Node.js 服务进程通常创建一个池，独立查询通过池执行。

## 连接上限就是数据库预算

`connectionLimit` 限制每个池的连接数。多个进程和副本会各自创建池，8 个副本每个限制 10 个连接，合计最多 80 个，还要给管理和其他服务留容量。`waitForConnections` 允许满载时排队。`queueLimit` 可以限制积压，应用的请求超时仍要单独设计。

独立查询调用 `pool.execute()`，池管理借出和归还。需要用同一个会话跑多条语句时借用连接，并在清理后归还。

## 用池读取用户订单

```js
import mysql from 'mysql2/promise'

// 进程启动时创建一次。连接信息来自部署环境。
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectionLimit: 10,
  waitForConnections: true,
  queueLimit: 40,
})

export async function listOrders(userId) {
  // SELECT 的第一个返回值是行数组，第二个是列元数据。
  const [rows] = await pool.execute(
    `SELECT CAST(o.id AS CHAR) AS id, o.status, o.total_amount
       FROM orders AS o WHERE o.user_id = ?
       ORDER BY o.created_at DESC, o.id DESC`,
    [userId],
  )
  return rows
}
```

样例中 `listOrders('1')` 返回订单 `"104"`（`"79.00"`）和 `"101"`（`"128.00"`），按此顺序。这里显式将 `BIGINT` ID 转为字符串，用 mysql2 的默认小数表示保留金额精度。服务关闭、并且在途任务已清理后，可调用 `await pool.end()`。

## 自测

### 1. 为什么页面每发送一个请求就创建一个新池会出问题？

<details>
<summary>查看答案</summary>

每个池各有连接预算，请求越多总连接数越难限制。连接握手和关闭也增加延迟。把池作为服务进程的共享资源。

</details>

### 2. 10 条查询正在使用一个大小为 10 的池，第 11 条一定立即失败吗？

<details>
<summary>查看答案</summary>

还取决于等待配置。按样例配置，排队未达到上限时它等待连接可用；排队达到上限后，新申请会失败。排队耗时也算接口延迟。

</details>

## 延伸阅读

- mysql2 文档的 Promise 封装和连接池用法。[Promise Wrapper](https://sidorares.github.io/node-mysql2/docs/documentation/promise-wrapper)
