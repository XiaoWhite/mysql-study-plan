下面是贯穿课程的小店数据。金额单位为元，时间统一为 UTC。每个示例从这份数据开始，除非正文注明了额外前提。库存是此刻的可售数。

### 用户与商品

| users.id | name | email            |
| -------- | ---- | ---------------- |
| 1        | 林悦 | lin@example.com  |
| 2        | 周远 | zhou@example.com |
| 3        | 许宁 | xu@example.com   |

| products.id | sku       | name   |  price | inventory.available |
| ----------- | --------- | ------ | -----: | ------------------: |
| 201         | KEY-CAP   | 键帽   |  49.00 |                   7 |
| 202         | MOUSE-PAD | 鼠标垫 |  79.00 |                   1 |
| 203         | USB-HUB   | 扩展坞 | 129.00 |                   4 |
| 204         | CABLE     | 数据线 |  39.00 |                  10 |

`inventory.product_id` 同时是主键和指向 `products.id` 的外键。

### 订单与明细

时间均为 `2026-03-01`，下表只展示时分。`NULL` 表示尚未付款。

| orders.id | user_id | status  | total_amount | created_at | paid_at |
| --------: | ------: | ------- | -----------: | ---------- | ------- |
|       101 |       1 | PAID    |       128.00 | 09:00      | 09:02   |
|       102 |       2 | PAID    |        49.00 | 09:15      | 09:17   |
|       103 |       2 | PENDING |       129.00 | 10:00      | `NULL`  |
|       104 |       1 | PAID    |        79.00 | 10:00      | 10:05   |

| order_items.order_id | line_no | product_id | quantity | unit_price |
| -------------------: | ------: | ---------: | -------: | ---------: |
|                  101 |       1 |        201 |        1 |      49.00 |
|                  101 |       2 |        202 |        1 |      79.00 |
|                  102 |       1 |        201 |        1 |      49.00 |
|                  103 |       1 |        203 |        1 |     129.00 |
|                  104 |       1 |        202 |        1 |      79.00 |

<details>
<summary>查看建表与样例 SQL</summary>

```sql
-- 在空的练习库中执行。TIMESTAMP 未用于本例，DATETIME 均按 UTC 写入。
CREATE TABLE users (
  id BIGINT UNSIGNED PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(254) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE products (
  id BIGINT UNSIGNED PRIMARY KEY,
  sku VARCHAR(40) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE inventory (
  product_id BIGINT UNSIGNED PRIMARY KEY,
  available INT NOT NULL CHECK (available >= 0),
  FOREIGN KEY (product_id) REFERENCES products(id)
) ENGINE=InnoDB;

CREATE TABLE orders (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  status VARCHAR(12) NOT NULL CHECK (status IN ('PENDING', 'PAID')),
  total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount >= 0),
  created_at DATETIME NOT NULL,
  paid_at DATETIME NULL,
  CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE order_items (
  order_id BIGINT UNSIGNED NOT NULL,
  line_no INT UNSIGNED NOT NULL,
  product_id BIGINT UNSIGNED NOT NULL,
  quantity INT NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
  PRIMARY KEY (order_id, line_no),
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
) ENGINE=InnoDB;

INSERT INTO users VALUES (1, '林悦', 'lin@example.com'),
  (2, '周远', 'zhou@example.com'), (3, '许宁', 'xu@example.com');
INSERT INTO products VALUES (201, 'KEY-CAP', '键帽', 49),
  (202, 'MOUSE-PAD', '鼠标垫', 79), (203, 'USB-HUB', '扩展坞', 129),
  (204, 'CABLE', '数据线', 39);
INSERT INTO inventory VALUES (201, 7), (202, 1), (203, 4), (204, 10);
INSERT INTO orders (id, user_id, status, total_amount, created_at, paid_at) VALUES
  (101, 1, 'PAID', 128, '2026-03-01 09:00:00', '2026-03-01 09:02:00'),
  (102, 2, 'PAID', 49, '2026-03-01 09:15:00', '2026-03-01 09:17:00'),
  (103, 2, 'PENDING', 129, '2026-03-01 10:00:00', NULL),
  (104, 1, 'PAID', 79, '2026-03-01 10:00:00', '2026-03-01 10:05:00');
INSERT INTO order_items VALUES (101, 1, 201, 1, 49), (101, 2, 202, 1, 79),
  (102, 1, 201, 1, 49), (103, 1, 203, 1, 129), (104, 1, 202, 1, 79);
```

</details>
