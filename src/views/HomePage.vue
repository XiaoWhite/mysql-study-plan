<script setup>
import { computed } from 'vue';
import LessonList from '../components/LessonList.vue';
import { useProgress } from '../composables/useProgress.js';
import { lessons, weeks } from '../data/course.js';

const { completed, recent, storageAvailable } = useProgress();

const percent = computed(() => Math.round((completed.value.size / lessons.length) * 100));
// 优先继续最近阅读的课时；没有记录时选择第一节未完成课，全部完成后回到第一课。
const continueId = computed(
  () => recent.value || lessons.find(({ id }) => !completed.value.has(id))?.id || lessons[0].id
);
const coursesRoute = { name: 'home', hash: '#courses' };

/** 计算某一周已完成的课时数，用于周进度展示。 */
function weekCount(week) {
  return week.lessons.filter(({ id }) => completed.value.has(id)).length;
}
</script>

<template>
  <main id="main-content">
    <section class="container hero">
      <div class="hero-inner">
        <div class="hero-copy">
          <span class="baseline"
            ><span class="status-dot" aria-hidden="true"></span> MySQL 8.4 LTS
            <span aria-hidden="true">/</span> InnoDB</span
          >
          <h1 tabindex="-1"><span>前端开发者的</span><br /><em>MySQL</em> 进阶路线</h1>
          <p class="hero-description">
            用电商案例学习表设计、查询性能和并发，练习审阅 AI 生成的 SQL 和 Node.js 代码。
          </p>
          <div class="hero-actions">
            <RouterLink class="button primary" :to="{ name: 'lesson', params: { id: continueId } }"
              >{{ recent ? '继续学习' : '开始学习' }} <span aria-hidden="true">→</span></RouterLink
            >
            <RouterLink class="button secondary" :to="coursesRoute"
              >查看课程 <span aria-hidden="true">↓</span></RouterLink
            >
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
                <caption>
                  查询结果
                  <span>3 行</span>
                </caption>
                <thead>
                  <tr>
                    <th scope="col">id</th>
                    <th scope="col">status</th>
                    <th scope="col">total_amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>104</td>
                    <td><span class="sql-status">PAID</span></td>
                    <td>79.00</td>
                  </tr>
                  <tr>
                    <td>103</td>
                    <td><span class="sql-status pending">PENDING</span></td>
                    <td>129.00</td>
                  </tr>
                  <tr>
                    <td>102</td>
                    <td><span class="sql-status">PAID</span></td>
                    <td>49.00</td>
                  </tr>
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
          <h2 id="roadmap-title" tabindex="-1">六周课程路线</h2>
          <p>从设计第一张表，到审阅完整的订单模块。</p>
        </div>
        <div class="progress-card">
          <div class="progress-copy">
            <span>学习进度</span>
            <span
              >已完成
              <strong class="numerals">{{ completed.size }} / {{ lessons.length }}</strong>
              节课</span
            >
          </div>
          <div class="progress-track">
            <progress
              :value="completed.size"
              :max="lessons.length"
              aria-label="已完成课数"
            ></progress>
            <span class="numerals" aria-hidden="true">{{ percent }}%</span>
          </div>
        </div>
      </div>
      <p v-if="!storageAvailable" class="storage-message roadmap-storage" role="status">
        浏览器存储不可用，进度仅在本次页面打开期间保留。
      </p>
      <div class="week-grid">
        <section
          v-for="week in weeks"
          :key="week.number"
          class="week-card"
          :aria-labelledby="`week-${week.number}`"
        >
          <div class="week-top">
            <span class="week-icon" aria-hidden="true">
              <span :class="`topic-${week.icon}`"></span>
            </span>
            <span class="week-number">第 {{ week.number }} 周</span>
            <span
              class="week-count numerals"
              :class="{ 'week-done': weekCount(week) === week.lessons.length }"
              :aria-label="`已完成 ${weekCount(week)} / ${week.lessons.length} 课`"
              >{{ weekCount(week) }}/{{ week.lessons.length }}</span
            >
          </div>
          <h3 :id="`week-${week.number}`">{{ week.title }}</h3>
          <p class="week-description">{{ week.description }}</p>
          <LessonList :lessons="week.lessons" :completed="completed" />
        </section>
      </div>
    </section>
  </main>
</template>
