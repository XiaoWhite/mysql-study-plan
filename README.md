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

## 代码检查与格式化

- `npm run lint` 检查 JavaScript 和 Vue 文件，`npm run lint:fix` 自动修复可修复的问题。
- `npm run format:check` 检查格式，`npm run format` 写入格式化结果。课程 Markdown 的代码示例在格式化时保留原样。

## 静态部署

### GitHub Pages

1. 在 GitHub 仓库的 **Settings → Pages** 中，将 **Build and deployment → Source** 设为 **GitHub Actions**。
2. 将包含 `.github/workflows/pages.yml` 的改动推送到 `main`。如果工作流已在 `main`，可以在 **Actions → Deploy to GitHub Pages** 中选择 **Run workflow** 立即部署。
3. 部署成功后，在 **Settings → Pages** 打开站点。此仓库的默认地址见 [MySQL 学习手册](https://xiaowhite.github.io/mysql-study-plan/)。

之后每次推送到 `main` 都会重新构建并发布。可以直接分享[课时链接](https://xiaowhite.github.io/mysql-study-plan/#/lesson/joins)。

### 其他静态服务器

把 `dist/` 中的 `index.html` 和 `assets/` 上传到静态服务器的站点根目录或指定子目录。子目录的入口使用带结尾斜杠的 URL，例如 `https://example.com/mysql/`。完整讲义链接示例为 `https://example.com/mysql/#/lesson/relational-tables`。

Vite 构建使用相对资源路径，课程路由放在 URL 的 hash 中。服务器只需提供静态文件和目录入口，无需为每节课配置路由，也无需运行 Node.js 或 MySQL。

手动标记的完成状态和最近阅读记录保存在当前浏览器的 `localStorage`，按站点来源和部署路径区分。浏览器禁止存储时仍可打开所有课程，当前打开页面内的进度和最近阅读可用，刷新后从空进度开始。

## 项目结构

- `src/views/`：路由页面。
- `src/components/`：可复用的 Vue 组件。
- `src/router/`：Vue Router 配置。
- `src/composables/`：组合式状态和逻辑。
- `src/data/`：课程元数据。
- `src/services/`：Markdown 加载和渲染服务。
- `src/content/`：课程 Markdown 讲义。
- `src/styles/` 和 `src/assets/`：公共样式和静态资源。

## 修改课程

`src/data/course.js` 定义课程顺序、标题和稳定 ID。每节课的 Markdown 文件位于 `src/content/`，文件名与 ID 一致。`src/content/case-study.md` 包含共享的表结构和样例数据。
