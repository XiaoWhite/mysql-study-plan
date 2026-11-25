<template>
  <main id="main-content" class="container missing-page">
    <h1 tabindex="-1">找不到这个页面</h1>
    <RouterLink class="button primary" :to="{ name: 'home', hash: '#courses' }">
      返回课程路线 <span aria-hidden="true">→</span>
    </RouterLink>
  </main>
</template>
