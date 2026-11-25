import { createRouter, createWebHashHistory } from 'vue-router';
import { lessonById } from '../data/course.js';
import HomePage from '../views/HomePage.vue';
import LessonPage from '../views/LessonPage.vue';
import NotFoundPage from '../views/NotFoundPage.vue';

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomePage,
    },
    {
      path: '/courses',
      redirect: { name: 'home', hash: '#courses' },
    },
    {
      path: '/lesson/:id',
      name: 'lesson',
      component: LessonPage,
      // 在进入页面前校验课时 ID，避免 LessonPage 收到不存在的课程数据。
      beforeEnter: (to) => {
        if (lessonById.has(to.params.id)) return true;
        // 使用命名的兜底路由保留原始 URL，同时渲染统一的 404 页面。
        return {
          name: 'not-found',
          params: { pathMatch: to.path.slice(1).split('/') },
          replace: true,
        };
      },
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: NotFoundPage,
    },
  ],
  /** 恢复浏览器历史位置，处理课程锚点，其余导航回到页面顶部。 */
  scrollBehavior(to, _from, savedPosition) {
    if (savedPosition) return savedPosition;
    if (to.hash) return { el: to.hash };
    return { top: 0 };
  },
});

// 每次导航完成后，根据当前课时更新浏览器标签标题。
router.afterEach((to) => {
  const lesson = to.name === 'lesson' ? lessonById.get(to.params.id) : undefined;
  document.title = lesson ? `${lesson.title} · MySQL 学习手册` : 'MySQL 学习手册';
});

export default router;
