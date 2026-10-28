<script setup>
import { computed, reactive, ref } from 'vue';
import { useStudentsStore } from '../stores/students';

const students = useStudentsStore();
const searchName = ref('');
const form = reactive({ name: '', id: '', phone: '', zip: '' });
const hasResult = computed(() => Boolean(students.student));

async function submitSearch() {
  const name = searchName.value.trim();
  if (!name) {
    students.error = 'Enter a student name to search.';
    students.message = '';
    return;
  }
  await students.search(name);
}

async function submitStudent() {
  const details = Object.fromEntries(
    Object.entries(form).map(([key, value]) => [key, value.trim()])
  );
  if (Object.values(details).some((value) => !value)) {
    students.error = 'Please complete every field.';
    students.message = '';
    return;
  }
  if (await students.add(details)) {
    Object.assign(form, { name: '', id: '', phone: '', zip: '' });
  }
}

async function deleteStudent() {
  if (!students.student || !window.confirm(`Delete student ${students.student.name}?`)) {
    return;
  }
  await students.remove(students.student.name);
}
</script>

<template>
  <section class="page-heading">
    <p class="eyebrow">STUDENT DIRECTORY</p>
    <h1>Manage students</h1>
    <p>Search for a student or add a new record to the directory.</p>
  </section>

  <p v-if="students.error" class="notice notice-error" role="alert">{{ students.error }}</p>
  <p v-else-if="students.message" class="notice notice-success" role="status">{{ students.message }}</p>

  <div class="content-grid">
    <section class="card">
      <div class="card-heading">
        <div><p class="eyebrow">LOOK UP A RECORD</p><h2>Find a student</h2></div>
        <span class="heading-icon" aria-hidden="true">⌕</span>
      </div>
      <form class="form-stack" @submit.prevent="submitSearch">
        <label for="student-search">Student name</label>
        <input id="student-search" v-model="searchName" autocomplete="name" required
          placeholder="e.g. John Smith">
        <button class="button button-primary" type="submit" :disabled="students.loading">
          {{ students.loading ? 'Searching…' : 'Search students' }}
        </button>
      </form>
      <p v-if="students.loading" class="muted" role="status">Searching student records…</p>
      <div v-else-if="hasResult" class="result-panel">
        <div class="result-title"><h3>{{ students.student.name }}</h3><span class="status-tag">Student</span></div>
        <dl class="details-grid">
          <div><dt>Student ID</dt><dd>{{ students.student.id }}</dd></div>
          <div><dt>Phone</dt><dd>{{ students.student.phone }}</dd></div>
          <div><dt>ZIP code</dt><dd>{{ students.student.zip }}</dd></div>
        </dl>
        <button class="button button-danger button-small" type="button" :disabled="students.loading"
          @click="deleteStudent">Delete student</button>
      </div>
      <p v-else class="muted empty-copy">Search results will appear here.</p>
    </section>

    <section class="card">
      <div class="card-heading">
        <div><p class="eyebrow">NEW DIRECTORY ENTRY</p><h2>Add a student</h2></div>
        <span class="heading-icon" aria-hidden="true">＋</span>
      </div>
      <form class="form-stack" @submit.prevent="submitStudent">
        <label for="student-name">Full name</label>
        <input id="student-name" v-model="form.name" autocomplete="name" required placeholder="e.g. Jane Doe">
        <label for="student-id">Student ID</label>
        <input id="student-id" v-model="form.id" required placeholder="e.g. 1002">
        <div class="form-row">
          <div class="form-stack">
            <label for="student-phone">Phone</label>
            <input id="student-phone" v-model="form.phone" type="tel" autocomplete="tel" required placeholder="555-1234">
          </div>
          <div class="form-stack">
            <label for="student-zip">ZIP code</label>
            <input id="student-zip" v-model="form.zip" inputmode="numeric" autocomplete="postal-code" required placeholder="77001">
          </div>
        </div>
        <button class="button button-primary" type="submit" :disabled="students.loading">
          {{ students.loading ? 'Saving…' : 'Add student' }}
        </button>
      </form>
    </section>
  </div>
</template>
