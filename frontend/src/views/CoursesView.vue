<script setup>
import { onMounted, reactive } from 'vue';
import { useCoursesStore } from '../stores/courses';

const store = useCoursesStore();
const form = reactive({ id: '', name: '' });

onMounted(() => store.load());

async function submitCourse() {
  const course = { id: form.id.trim(), name: form.name.trim() };
  if (!course.id || !course.name) {
    store.error = 'Course ID and course name are required.';
    store.message = '';
    return;
  }
  if (await store.add(course)) {
    Object.assign(form, { id: '', name: '' });
  }
}

async function deleteCourse(course) {
  if (window.confirm(`Delete course ${course.id} — ${course.name}?`)) {
    await store.remove(course.id);
  }
}
</script>

<template>
  <section class="page-heading">
    <p class="eyebrow">COURSE CATALOG</p>
    <h1>Manage courses</h1>
    <p>Create courses and keep the catalog up to date.</p>
  </section>

  <p v-if="store.error" class="notice notice-error" role="alert">{{ store.error }}</p>
  <p v-else-if="store.message" class="notice notice-success" role="status">{{ store.message }}</p>

  <div class="content-grid">
    <section class="card">
      <div class="card-heading">
        <div><p class="eyebrow">COURSE DETAILS</p><h2>Add a course</h2></div>
        <span class="heading-icon" aria-hidden="true">＋</span>
      </div>
      <form class="form-stack" @submit.prevent="submitCourse">
        <label for="course-id">Course ID</label>
        <input id="course-id" v-model="form.id" required placeholder="e.g. CIS 3339">
        <label for="course-name">Course name</label>
        <input id="course-name" v-model="form.name" required placeholder="e.g. Enterprise Applications Development">
        <button class="button button-primary" type="submit" :disabled="store.loading">
          {{ store.loading ? 'Saving…' : 'Add course' }}
        </button>
      </form>
    </section>

    <section class="card">
      <div class="card-heading">
        <div><p class="eyebrow">AVAILABLE COURSES</p><h2>Course list</h2></div>
        <span class="count-badge">{{ store.courses.length }}</span>
      </div>
      <p v-if="store.loading && store.courses.length === 0" class="muted" role="status">Loading courses…</p>
      <p v-else-if="store.courses.length === 0" class="muted empty-copy">No courses yet. Add one to get started.</p>
      <ul v-else class="course-list">
        <li v-for="course in store.courses" :key="course.id" class="course-item">
          <div class="course-mark" aria-hidden="true">C</div>
          <div class="course-info"><strong>{{ course.id }}</strong><span>{{ course.name }}</span></div>
          <button class="button button-danger button-small" type="button" :disabled="store.loading"
            :aria-label="`Delete ${course.id}`" @click="deleteCourse(course)">Delete</button>
        </li>
      </ul>
    </section>
  </div>
</template>
