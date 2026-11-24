# MySQL 学习手册

面向已经会写简单 SQL 的前端开发者。用一个电商案例学习 MySQL 8.4 LTS 和 InnoDB，六周共 18 节课，每周约 3–4 小时。讲义中的 SQL 和 Node.js 代码都可以结合样例数据阅读和推演。

## 本地学习

使用 Node.js 20.19+（20.x）或 22.12+，在项目目录执行：

```sh
npm install
npm run dev
```

打开终端显示的地址，默认是 `http://localhost:5173/`。打开任意讲义后，可以复制地址栏的链接分享该节课。

## 构建与预览

```sh
npm run build
npm run preview
```

构建输出到 `dist/`。预览地址默认是 `http://localhost:4173/`。

## 静态部署

把 `dist/` 中的 `index.html` 和 `assets/` 上传到静态服务器的站点根目录或指定子目录。子目录的入口使用带结尾斜杠的 URL，例如 `https://example.com/mysql/`。完整讲义链接示例为 `https://example.com/mysql/#/lesson/relational-tables`。

Vite 构建使用相对资源路径，课程路由放在 URL 的 hash 中。服务器只需提供静态文件和目录入口，无需为每节课配置路由，也无需运行 Node.js 或 MySQL。

手动标记的完成状态和最近阅读记录保存在当前浏览器的 `localStorage`，按站点来源和部署路径区分。浏览器禁止存储时仍可打开所有课程，当前打开页面内的进度和最近阅读可用，刷新后从空进度开始。

## 修改课程

`src/course.js` 定义课程顺序、标题和稳定 ID。每节课的 Markdown 文件位于 `src/content/`，文件名与 ID 一致。`src/content/case-study.md` 包含共享的表结构和样例数据。
