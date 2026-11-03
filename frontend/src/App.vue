<script setup>
import AppNavigation from './components/AppNavigation.vue';
</script>

<template>
  <div class="app-shell">
    <a class="skip-link" href="#main-content">Skip to main content</a>
    <AppNavigation />
    <main id="main-content" class="page-container">
      <RouterView />
    </main>
    <footer class="site-footer">Student and course records</footer>
  </div>
</template>
