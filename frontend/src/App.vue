<script setup>
import AppNavigation from './components/AppNavigation.vue';
</script>

<template>
  <div class="app-shell">
    <AppNavigation />
    <main class="page-container">
      <RouterView />
    </main>
    <footer class="site-footer">Student and course records</footer>
  </div>
</template>
