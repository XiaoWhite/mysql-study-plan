<script setup>
import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import LessonList from '../components/LessonList.vue';
import { useProgress } from '../composables/useProgress.js';
import { lessonById, lessons, weeks } from '../data/course.js';
import { caseStudyHtml, loadLesson } from '../services/markdown.js';

const route = useRoute();
const { completed, recordRecent, storageAvailable, toggleComplete } = useProgress();
// 由路由参数派生当前课时以及前后翻页所需的数据。
const current = computed(() => lessonById.get(route.params.id));
const currentWeek = computed(() => weeks[current.value.week - 1]);
const lessonIndex = computed(() => lessons.indexOf(current.value));
const previous = computed(() => lessons[lessonIndex.value - 1]);
const next = computed(() => lessons[lessonIndex.value + 1]);
const outlineOpen = ref(false);
const lessonHtml = ref('');
const lessonFailed = ref(false);
const lessonLoading = ref(false);
const coursesRoute = { name: 'home', hash: '#courses' };

// 课时路由变化时重置页面状态、记录阅读位置，并异步加载对应讲义。
watch(
  current,
  async (lesson, _, onCleanup) => {
    outlineOpen.value = false;
    lessonHtml.value = '';
    lessonFailed.value = false;
    lessonLoading.value = true;
    recordRecent(lesson.id);

    let cancelled = false;
    // 用户快速切课时后，旧请求可能更晚完成；清理标记可阻止旧内容覆盖新页面。
    onCleanup(() => {
      cancelled = true;
    });
    try {
      const html = await loadLesson(lesson.id);
      if (!cancelled) lessonHtml.value = html;
    } catch {
      if (!cancelled) lessonFailed.value = true;
    } finally {
      if (!cancelled) lessonLoading.value = false;
    }
  },
  { immediate: true }
);
</script>

<template>
  <main id="main-content" :key="current.id" class="container reader">
    <aside class="reader-sidebar">
      <button
        class="outline-toggle"
        type="button"
        :aria-expanded="outlineOpen"
        aria-controls="lesson-outline"
        @click="outlineOpen = !outlineOpen"
      >
        课程目录 <span aria-hidden="true">{{ outlineOpen ? '−' : '+' }}</span>
      </button>
      <nav
        id="lesson-outline"
        class="outline"
        :class="{ 'outline-open': outlineOpen }"
        aria-label="课程目录"
      >
        <p class="outline-label">
          课程目录 <span class="numerals">{{ completed.size }}/{{ lessons.length }}</span>
        </p>
        <section
          v-for="week in weeks"
          :key="week.number"
          class="outline-group"
          :class="{ 'outline-current': week.number === current.week }"
        >
          <h2>
            第 {{ week.number }} 周 <span>{{ week.title }}</span>
          </h2>
          <LessonList :lessons="week.lessons" :completed="completed" />
        </section>
      </nav>
    </aside>

    <article class="lesson-page">
      <header class="lesson-header">
        <nav class="breadcrumb" aria-label="面包屑">
          <RouterLink :to="coursesRoute">课程路线</RouterLink>
          <span aria-hidden="true">/</span>
          <span>第 {{ current.week }} 周 · {{ currentWeek.title }}</span>
        </nav>
        <h1 tabindex="-1">{{ current.title }}</h1>
        <div class="lesson-meta">
          <span class="baseline">第 {{ lessonIndex + 1 }} / {{ lessons.length }} 课</span>
          <button
            class="button completion"
            type="button"
            :aria-pressed="completed.has(current.id)"
            @click="toggleComplete(current.id)"
          >
            <span
              class="lesson-dot"
              :class="{ checked: completed.has(current.id) }"
              aria-hidden="true"
            ></span>
            {{ completed.has(current.id) ? '已完成' : '标记为完成' }}
          </button>
        </div>
        <p v-if="!storageAvailable" class="storage-message" role="status">
          浏览器存储不可用，进度仅在本次页面打开期间保留。
        </p>
      </header>

      <details class="case-study">
        <summary>电商案例 · 表结构与样例数据</summary>
        <div class="prose" v-html="caseStudyHtml"></div>
      </details>
      <p v-if="lessonLoading" role="status">正在加载讲义…</p>
      <p v-else-if="lessonFailed" role="alert">
        讲义加载失败。请刷新页面重试，或<RouterLink :to="coursesRoute">返回课程路线</RouterLink>。
      </p>
      <div v-else class="prose lesson-prose" v-html="lessonHtml"></div>

      <nav class="lesson-pagination" aria-label="上一课和下一课">
        <RouterLink v-if="previous" :to="{ name: 'lesson', params: { id: previous.id } }">
          <span>← 上一课</span>
          <strong>{{ previous.title }}</strong>
        </RouterLink>
        <RouterLink
          :to="next ? { name: 'lesson', params: { id: next.id } } : coursesRoute"
          class="pagination-next"
        >
          <span>{{ next ? '下一课' : '课程路线' }} →</span>
          <strong>{{ next ? next.title : '查看学习进度' }}</strong>
        </RouterLink>
      </nav>
    </article>
  </main>
</template>
