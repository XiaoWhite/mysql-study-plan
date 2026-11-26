import MarkdownIt from 'markdown-it';
import caseStudy from '../content/case-study.md?raw';

// 讲义中的自测答案使用受控 HTML，因此只对随项目打包的 Markdown 开启 HTML。
const markdown = new MarkdownIt({ html: true });
const renderFence = markdown.renderer.rules.fence;

// 为宽表格增加横向滚动容器和键盘可访问的区域说明。
markdown.renderer.rules.table_open = () =>
  '<div class="table-scroll" tabindex="0" role="region" aria-label="讲义表格"><table>\n';
// 与自定义的表格开始标签配对，关闭表格及其滚动容器。
markdown.renderer.rules.table_close = () => '</table></div>\n';

// 添加语言标题和 SQL 复制按钮，并让代码区域可以通过键盘聚焦滚动。
markdown.renderer.rules.fence = (tokens, index, options, env, renderer) => {
  const [language] = tokens[index].info.trim().toLowerCase().split(/\s+/);
  const label = { sql: 'SQL', js: 'JavaScript', bash: 'Shell', text: '执行结果' }[language];
  const copyControls =
    language === 'sql'
      ? '<span class="copy-sql-status" role="status"></span><button class="copy-sql" type="button">复制 SQL</button>'
      : '';
  const caption = label ? `<figcaption>${label}${copyControls}</figcaption>` : '';
  const code = renderFence(tokens, index, options, env, renderer).replace(
    '<pre>',
    '<pre tabindex="0">'
  );
  return `<figure class="code-sample">${caption}${code}</figure>\n`;
};

const files = import.meta.glob(['../content/*.md', '!../content/case-study.md'], {
  query: '?raw',
  import: 'default',
});
export const caseStudyHtml = markdown.render(caseStudy);

/** 按课时 ID 异步加载对应 Markdown，并渲染为可直接展示的 HTML。 */
export async function loadLesson(id) {
  return markdown.render(await files[`../content/${id}.md`]());
}
