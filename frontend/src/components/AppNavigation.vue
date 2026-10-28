<script setup>
import { RouterLink } from 'vue-router';
</script>

<template>
  <header class="site-header">
    <RouterLink class="brand" to="/" aria-label="Student management home">
      <span class="brand-mark" aria-hidden="true">S</span>
      <span>Campus Desk</span>
    </RouterLink>
    <nav class="navigation" aria-label="Main navigation">
      <RouterLink to="/">Students</RouterLink>
      <RouterLink to="/courses">Courses</RouterLink>
    </nav>
  </header>
</template>
