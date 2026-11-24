import MarkdownIt from 'markdown-it'
import caseStudy from './content/case-study.md?raw'

// HTML is enabled for the answer disclosures in the bundled course files.
const markdown = new MarkdownIt({ html: true })
const renderFence = markdown.renderer.rules.fence

markdown.renderer.rules.table_open = () =>
  '<div class="table-scroll" tabindex="0" role="region" aria-label="讲义表格"><table>\n'
markdown.renderer.rules.table_close = () => '</table></div>\n'
markdown.renderer.rules.fence = (tokens, index, options, env, renderer) => {
  const language = tokens[index].info.trim()
  const label = { sql: 'SQL', js: 'JavaScript', bash: 'Shell', text: '执行结果' }[language]
  const caption = label ? `<figcaption>${label}</figcaption>` : ''
  const code = renderFence(tokens, index, options, env, renderer).replace('<pre>', '<pre tabindex="0">')
  return `<figure class="code-sample">${caption}${code}</figure>\n`
}

const files = import.meta.glob(['./content/*.md', '!./content/case-study.md'], { query: '?raw', import: 'default' })
export const caseStudyHtml = markdown.render(caseStudy)

export async function loadLesson(id) {
  return markdown.render(await files[`./content/${id}.md`]())
}
