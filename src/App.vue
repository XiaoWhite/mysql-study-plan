<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { lessonById, lessonLink, lessons, weeks } from './course.js'
import { caseStudyHtml, loadLesson } from './markdown.js'
import LessonList from './LessonList.vue'

const storagePath = window.location.pathname.replace(/\/index\.html$/, '/').replace(/\/$/, '')
const storagePrefix = `mysql-study-plan:v1:${storagePath}:`
const recentKey = `${storagePrefix}recent`
const completionKey = (id) => `${storagePrefix}complete:${id}`
const completed = ref(new Set())
const recent = ref('')
const storageAvailable = ref(true)

function readProgress() {
  try {
    const storage = window.localStorage
    const saved = storage.getItem(recentKey)
    completed.value = new Set(lessons.map(({ id }) => id).filter((id) => storage.getItem(completionKey(id)) === '1'))
    recent.value = lessonById.has(saved) ? saved : ''
  } catch {
    storageAvailable.value = false
  }
}

function writeProgress(key, value) {
  try {
    if (value === null) window.localStorage.removeItem(key)
    else window.localStorage.setItem(key, value)
    storageAvailable.value = true
  } catch {
    storageAvailable.value = false
  }
}

function onStorage(event) {
  if (event.key === null || event.key.startsWith(storagePrefix)) readProgress()
}

readProgress()

const hash = ref(window.location.hash)
const lessonId = computed(() => hash.value.match(/^#\/lesson\/([a-z0-9-]+)$/)?.[1] ?? '')
const current = computed(() => lessonById.get(lessonId.value))
const currentWeek = computed(() => current.value && weeks[current.value.week - 1])
const missingLesson = computed(() => hash.value.startsWith('#/lesson/') && !current.value)
const isHome = computed(() => !current.value && !missingLesson.value)
const lessonIndex = computed(() => lessons.indexOf(current.value))
const previous = computed(() => lessons[lessonIndex.value - 1])
const next = computed(() => lessons[lessonIndex.value + 1])
const percent = computed(() => Math.round(completed.value.size / lessons.length * 100))
const continueId = computed(() => recent.value || lessons.find(({ id }) => !completed.value.has(id))?.id || lessons[0].id)
const outlineOpen = ref(false)
const roadmap = ref(null)
const heading = ref(null)
const lessonHtml = ref('')
const lessonFailed = ref(false)
const lessonLoading = ref(false)

watch(current, async (lesson, _, onCleanup) => {
  outlineOpen.value = false
  lessonHtml.value = ''
  lessonFailed.value = false
  lessonLoading.value = Boolean(lesson)
  document.title = lesson ? `${lesson.title} · MySQL 学习手册` : 'MySQL 学习手册'
  if (!lesson) return

  recent.value = lesson.id
  writeProgress(recentKey, lesson.id)

  let cancelled = false
  onCleanup(() => { cancelled = true })
  try {
    const html = await loadLesson(lesson.id)
    if (!cancelled) lessonHtml.value = html
  } catch {
    if (!cancelled) lessonFailed.value = true
  } finally {
    if (!cancelled) lessonLoading.value = false
  }
}, { immediate: true })

function toggleComplete() {
  const { id } = current.value
  if (completed.value.has(id)) completed.value.delete(id)
  else completed.value.add(id)
  writeProgress(completionKey(id), completed.value.has(id) ? '1' : null)
}

function weekCount(week) {
  return week.lessons.filter(({ id }) => completed.value.has(id)).length
}

async function moveToRoute(focus = true) {
  await nextTick()
  if (hash.value === '#courses') {
    if (focus) roadmap.value?.focus({ preventScroll: true })
    roadmap.value?.scrollIntoView({ block: 'start' })
  } else {
    if (focus) heading.value?.focus({ preventScroll: true })
    window.scrollTo(0, 0)
  }
}

function onHashChange() {
  hash.value = window.location.hash
  moveToRoute()
}

function followCurrentHash(event) {
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
  if (event.currentTarget.hash === hash.value) moveToRoute()
}

onMounted(() => {
  window.addEventListener('hashchange', onHashChange)
  window.addEventListener('storage', onStorage)
  moveToRoute(false)
})
onUnmounted(() => {
  window.removeEventListener('hashchange', onHashChange)
  window.removeEventListener('storage', onStorage)
})
</script>

<template>
  <a class="skip-link" href="#main-content" @click.prevent="heading?.focus()">跳到正文</a>

  <header class="site-header">
    <div class="container header-inner">
      <a class="brand" href="#/" @click="followCurrentHash">
        <span class="brand-icon" aria-hidden="true"><i></i></span>
        <span>MySQL 学习手册</span>
      </a>
      <nav class="site-nav" aria-label="网站导航">
        <a href="#/" :aria-current="isHome && hash !== '#courses' ? 'page' : undefined" @click="followCurrentHash">首页</a>
        <a href="#courses" :aria-current="hash === '#courses' ? 'location' : undefined" @click="followCurrentHash">课程路线</a>
      </nav>
      <a class="header-progress" href="#courses" @click="followCurrentHash" :aria-label="`课程进度，已完成 ${completed.size} / ${lessons.length} 课`">
        <span class="status-dot" aria-hidden="true"></span>
        <span class="header-progress-label">学习进度</span>
        <span class="numerals">{{ completed.size }}/{{ lessons.length }}</span>
      </a>
    </div>
  </header>

  <main id="main-content" v-if="isHome">
    <section class="container hero">
      <div class="hero-inner">
        <div class="hero-copy">
          <span class="baseline"><span class="status-dot" aria-hidden="true"></span> MySQL 8.4 LTS <span aria-hidden="true">/</span> InnoDB</span>
          <h1 ref="heading" tabindex="-1"><span>前端开发者的</span><br /><em>MySQL</em> 进阶路线</h1>
          <p class="hero-description">用电商案例学习表设计、查询性能和并发，练习审阅 AI 生成的 SQL 和 Node.js 代码。</p>
          <div class="hero-actions">
            <a class="button primary" :href="lessonLink(continueId)">{{ recent ? '继续学习' : '开始学习' }} <span aria-hidden="true">→</span></a>
            <a class="button secondary" href="#courses" @click="followCurrentHash">查看课程 <span aria-hidden="true">↓</span></a>
          </div>
          <ul class="hero-meta" aria-label="课程安排">
            <li><span class="meta-icon calendar" aria-hidden="true"></span>6 周</li>
            <li><span class="meta-icon clock" aria-hidden="true"></span>每周 3–4 小时</li>
            <li><span class="meta-icon book" aria-hidden="true"></span>18 节课</li>
          </ul>
        </div>

        <figure class="terminal" aria-label="订单查询示例">
          <figcaption class="terminal-bar">
            <span class="terminal-file-icon" aria-hidden="true">›_</span>
            <span>recent_orders.sql</span>
          </figcaption>
          <div class="terminal-body">
            <pre class="terminal-code"><code><span class="sql-comment">-- 小店最近的订单</span>
<span class="sql-keyword">SELECT</span> id, status, total_amount
<span class="sql-keyword">FROM</span> orders
<span class="sql-keyword">ORDER BY</span> created_at <span class="sql-keyword">DESC</span>, id <span class="sql-keyword">DESC</span>
<span class="sql-keyword">LIMIT</span> <span class="sql-number">3</span>;</code></pre>
            <div class="terminal-result">
              <table>
                <caption>查询结果 <span>3 行</span></caption>
                <thead><tr><th scope="col">id</th><th scope="col">status</th><th scope="col">total_amount</th></tr></thead>
                <tbody>
                  <tr><td>104</td><td><span class="sql-status">PAID</span></td><td>79.00</td></tr>
                  <tr><td>103</td><td><span class="sql-status pending">PENDING</span></td><td>129.00</td></tr>
                  <tr><td>102</td><td><span class="sql-status">PAID</span></td><td>49.00</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </figure>
      </div>
    </section>

    <section id="courses" class="container roadmap" aria-labelledby="roadmap-title">
      <div class="roadmap-header">
        <div class="section-heading">
          <h2 id="roadmap-title" ref="roadmap" tabindex="-1">六周课程路线</h2>
          <p>从设计第一张表，到审阅完整的订单模块。</p>
        </div>
        <div class="progress-card">
          <div class="progress-copy">
            <span>学习进度</span>
            <span>已完成 <strong class="numerals">{{ completed.size }} / {{ lessons.length }}</strong> 节课</span>
          </div>
          <div class="progress-track">
            <progress :value="completed.size" :max="lessons.length" aria-label="已完成课数"></progress>
            <span class="numerals" aria-hidden="true">{{ percent }}%</span>
          </div>
        </div>
      </div>
      <p v-if="!storageAvailable" class="storage-message roadmap-storage" role="status">浏览器存储不可用，进度仅在本次页面打开期间保留。</p>
      <div class="week-grid">
        <section v-for="week in weeks" :key="week.number" class="week-card" :aria-labelledby="`week-${week.number}`">
          <div class="week-top">
            <span class="week-icon" aria-hidden="true">
              <span :class="`topic-${week.icon}`"></span>
            </span>
            <span class="week-number">第 {{ week.number }} 周</span>
            <span class="week-count numerals" :class="{ 'week-done': weekCount(week) === week.lessons.length }" :aria-label="`已完成 ${weekCount(week)} / ${week.lessons.length} 课`">{{ weekCount(week) }}/{{ week.lessons.length }}</span>
          </div>
          <h3 :id="`week-${week.number}`">{{ week.title }}</h3>
          <p class="week-description">{{ week.description }}</p>
          <LessonList :lessons="week.lessons" :completed="completed" />
        </section>
      </div>
    </section>
  </main>

  <main id="main-content" v-else-if="current" class="container reader" :key="current.id">
    <aside class="reader-sidebar">
      <button class="outline-toggle" type="button" :aria-expanded="outlineOpen" aria-controls="lesson-outline" @click="outlineOpen = !outlineOpen">
        课程目录 <span aria-hidden="true">{{ outlineOpen ? '−' : '+' }}</span>
      </button>
      <nav id="lesson-outline" class="outline" :class="{ 'outline-open': outlineOpen }" aria-label="课程目录">
        <p class="outline-label">课程目录 <span class="numerals">{{ completed.size }}/{{ lessons.length }}</span></p>
        <section v-for="week in weeks" :key="week.number" class="outline-group" :class="{ 'outline-current': week.number === current.week }">
          <h2>第 {{ week.number }} 周 <span>{{ week.title }}</span></h2>
          <LessonList :lessons="week.lessons" :completed="completed" :current-id="current.id" />
        </section>
      </nav>
    </aside>

    <article class="lesson-page">
      <header class="lesson-header">
        <nav class="breadcrumb" aria-label="面包屑">
          <a href="#courses">课程路线</a>
          <span aria-hidden="true">/</span>
          <span>第 {{ current.week }} 周 · {{ currentWeek.title }}</span>
        </nav>
        <h1 ref="heading" tabindex="-1">{{ current.title }}</h1>
        <div class="lesson-meta">
          <span class="baseline">第 {{ lessonIndex + 1 }} / {{ lessons.length }} 课</span>
          <button class="button completion" type="button" :aria-pressed="completed.has(current.id)" @click="toggleComplete">
            <span class="lesson-dot" :class="{ checked: completed.has(current.id) }" aria-hidden="true"></span>
            {{ completed.has(current.id) ? '已完成' : '标记为完成' }}
          </button>
        </div>
        <p v-if="!storageAvailable" class="storage-message" role="status">浏览器存储不可用，进度仅在本次页面打开期间保留。</p>
      </header>

      <details class="case-study">
        <summary>电商案例 · 表结构与样例数据</summary>
        <div class="prose" v-html="caseStudyHtml"></div>
      </details>
      <p v-if="lessonLoading" role="status">正在加载讲义…</p>
      <p v-else-if="lessonFailed" role="alert">讲义加载失败。请刷新页面重试，或<a href="#courses">返回课程路线</a>。</p>
      <div v-else class="prose lesson-prose" v-html="lessonHtml"></div>

      <nav class="lesson-pagination" aria-label="上一课和下一课">
        <a v-if="previous" :href="lessonLink(previous.id)">
          <span>← 上一课</span>
          <strong>{{ previous.title }}</strong>
        </a>
        <a :href="next ? lessonLink(next.id) : '#courses'" class="pagination-next">
          <span>{{ next ? '下一课' : '课程路线' }} →</span>
          <strong>{{ next ? next.title : '查看学习进度' }}</strong>
        </a>
      </nav>
    </article>
  </main>

  <main id="main-content" v-else class="container missing-page">
    <h1 ref="heading" tabindex="-1">找不到这节课</h1>
    <a class="button primary" href="#courses">返回课程路线 <span aria-hidden="true">→</span></a>
  </main>

  <footer class="site-footer">
    <div class="container footer-inner">
      <a class="brand" href="#/" @click="followCurrentHash">MySQL 学习手册</a>
      <span>MySQL 8.4 LTS / InnoDB</span>
    </div>
  </footer>
</template>
