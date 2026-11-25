<script setup>
defineProps({
  lessons: { type: Array, required: true },
  completed: { type: Set, required: true },
});
</script>

<template>
  <ol class="lesson-list">
    <li v-for="lesson in lessons" :key="lesson.id">
      <RouterLink :to="{ name: 'lesson', params: { id: lesson.id } }">
        <span class="lesson-dot" :class="{ checked: completed.has(lesson.id) }">
          <span v-if="completed.has(lesson.id)" class="sr-only">已完成</span>
        </span>
        <span>{{ lesson.title }}</span>
        <span class="lesson-arrow" aria-hidden="true">→</span>
      </RouterLink>
    </li>
  </ol>
</template>
