# Repository Guidelines

## 项目结构

本仓库是面向前端开发者的 MySQL 8.4 LTS 与 InnoDB 中文课程，使用 Vue 3、Vue Router 和 Vite 构建为静态站点。`index.html` 和 `src/main.js` 是入口，`src/App.vue` 负责公共布局。页面位于 `src/views/`，通用组件位于 `src/components/`，路由、组合式函数、课程数据和服务分别位于 `src/router/`、`src/composables/`、`src/data/` 和 `src/services/`。公共样式位于 `src/styles/main.css`，Geist 字体位于 `src/assets/`，许可证位于 `public/assets/`。

`src/data/course.js` 定义课程顺序、标题和课时 ID，`src/services/markdown.js` 渲染 `src/content/` 中的讲义。更新 SQL 示例时，沿用 `src/content/case-study.md` 中的表结构和样例数据。

## 开发命令

使用 Node.js 20.x（最低 20.19）或 22.12 及以上版本。

- `npm ci` 根据 `package-lock.json` 安装依赖。
- `npm run dev` 启动 Vite 开发服务器，默认地址为 `http://localhost:5173/`。
- `npm run build` 将静态站点构建到 `dist/`。用 `npm run preview` 在本地预览构建结果。
- `npm run lint` 用 ESLint 检查 JavaScript 和 Vue 文件。`npm run lint:fix` 自动修复可修复的问题。
- `npm run format:check` 用 Prettier 检查格式。`npm run format` 写入格式化结果。

## 编码风格与命名

使用两个空格缩进。JavaScript 字符串使用单引号，语句末尾使用分号。Vue 组件文件名使用大驼峰命名，例如 `LessonList.vue`。讲义使用中文，Markdown 文件名用小写字母和连字符，并与 `src/data/course.js` 中对应的 ID 一致。课程链接和学习进度依赖现有 ID，修改标题时请保留 ID。Prettier 会保留讲义代码块内的格式。

## 验证改动

项目目前没有自动化测试或覆盖率要求。提交前运行 `npm run lint`、`npm run format:check` 和 `npm run build`。预览有改动的讲义，检查 SQL 代码块、表格和自测答案的展开效果。修改导航或学习进度时，直接访问 `#/lesson/joins` 等课时链接，将课时标记为完成，再刷新页面确认进度已保存。

## 提交与拉取请求

Git 历史目前只有 `Initial commit`。提交标题应简短并说明改动。拉取请求应说明影响了哪些讲义或功能，并列出已执行的检查。有相关议题时附上链接，界面有可见变化时附上截图。
