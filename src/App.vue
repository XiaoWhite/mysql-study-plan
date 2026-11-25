<script setup>
import { computed, nextTick, onMounted, onUnmounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useProgress } from './composables/useProgress.js';
import { lessons } from './data/course.js';

const route = useRoute();
const { completed, onProgressStorage } = useProgress();
const homeRoute = { name: 'home' };
const coursesRoute = { name: 'home', hash: '#courses' };
const homeCurrent = computed(() => route.name === 'home' && route.hash !== '#courses');
const coursesCurrent = computed(() => route.name === 'home' && route.hash === '#courses');

/** 将键盘焦点移到当前页面主标题，供“跳到正文”链接使用。 */
function focusMainHeading() {
  document.querySelector('#main-content h1')?.focus();
}

// 路由视图渲染完成后移动焦点，确保键盘和读屏用户能感知页面已切换。
watch(
  () => route.fullPath,
  async () => {
    await nextTick();
    const target = route.hash === '#courses' ? '#roadmap-title' : '#main-content h1';
    document.querySelector(target)?.focus({ preventScroll: true });
  }
);

// 监听其他标签页对 localStorage 的修改，并在组件卸载时释放监听器。
onMounted(() => window.addEventListener('storage', onProgressStorage));
onUnmounted(() => window.removeEventListener('storage', onProgressStorage));
</script>

<template>
  <a class="skip-link" href="#main-content" @click.prevent="focusMainHeading">跳到正文</a>

  <header class="site-header">
    <div class="container header-inner">
      <RouterLink v-slot="{ href, navigate }" custom :to="homeRoute">
        <a class="brand" :href="href" @click="navigate">
          <span class="brand-icon" aria-hidden="true"><i></i></span>
          <span>MySQL 学习手册</span>
        </a>
      </RouterLink>
      <nav class="site-nav" aria-label="网站导航">
        <RouterLink v-slot="{ href, navigate }" custom :to="homeRoute">
          <a :href="href" :aria-current="homeCurrent ? 'page' : undefined" @click="navigate"
            >首页</a
          >
        </RouterLink>
        <RouterLink v-slot="{ href, navigate }" custom :to="coursesRoute">
          <a :href="href" :aria-current="coursesCurrent ? 'location' : undefined" @click="navigate"
            >课程路线</a
          >
        </RouterLink>
      </nav>
      <RouterLink
        class="header-progress"
        :to="coursesRoute"
        :aria-label="`课程进度，已完成 ${completed.size} / ${lessons.length} 课`"
      >
        <span class="status-dot" aria-hidden="true"></span>
        <span class="header-progress-label">学习进度</span>
        <span class="numerals">{{ completed.size }}/{{ lessons.length }}</span>
      </RouterLink>
    </div>
  </header>

  <RouterView />

  <footer class="site-footer">
    <div class="container footer-inner">
      <RouterLink class="brand" :to="homeRoute">MySQL 学习手册</RouterLink>
      <span>MySQL 8.4 LTS / InnoDB</span>
    </div>
  </footer>
</template>
