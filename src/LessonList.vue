<script setup>
import { lessonLink } from './course.js'

defineProps({
  lessons: { type: Array, required: true },
  completed: { type: Set, required: true },
  currentId: { type: String, default: '' },
})
</script>

<template>
  <ol class="lesson-list">
    <li v-for="lesson in lessons" :key="lesson.id">
      <a :href="lessonLink(lesson.id)" :aria-current="currentId === lesson.id ? 'page' : undefined">
        <span class="lesson-dot" :class="{ checked: completed.has(lesson.id) }">
          <span v-if="completed.has(lesson.id)" class="sr-only">已完成</span>
        </span>
        <span>{{ lesson.title }}</span>
        <span class="lesson-arrow" aria-hidden="true">→</span>
      </a>
    </li>
  </ol>
</template>
