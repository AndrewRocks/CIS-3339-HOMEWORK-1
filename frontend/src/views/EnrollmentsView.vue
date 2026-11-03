<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useEnrollmentsStore } from '../stores/enrollments';

const store = useEnrollmentsStore();
const selectedStudentId = ref('');
const selectedCourseId = ref('');
const canEnroll = computed(() => store.students.length > 0 && store.courses.length > 0);
const selectedCourse = computed(() =>
  store.courses.find((course) => course.id === selectedCourseId.value)
);

onMounted(async () => {
  await store.loadOptions();
});

watch(selectedCourseId, (courseId) => {
  store.loadRoster(courseId);
});

async function submitEnrollment() {
  if (!selectedStudentId.value || !selectedCourseId.value) {
    store.error = 'Select both a student and a course.';
    store.message = '';
    return;
  }

  await store.enroll(selectedStudentId.value, selectedCourseId.value);
}
</script>

<template>
  <section class="page-heading">
    <p class="eyebrow">CLASS REGISTRATION</p>
    <h1>Manage enrollments</h1>
    <p>Enroll students in courses and view each course roster.</p>
  </section>

  <p v-if="store.error" class="notice notice-error" role="alert">{{ store.error }}</p>
  <p v-else-if="store.message" class="notice notice-success" role="status">{{ store.message }}</p>

  <div class="content-grid">
    <section class="card">
      <div class="card-heading">
        <div><p class="eyebrow">NEW REGISTRATION</p><h2>Enroll a student</h2></div>
        <span class="heading-icon" aria-hidden="true">＋</span>
      </div>
      <p v-if="store.loading && !canEnroll" class="muted" role="status">Loading students and courses…</p>
      <p v-else-if="!canEnroll && !store.error" class="muted empty-copy">
        Add at least one student and one course before creating an enrollment.
      </p>
      <form v-else class="form-stack" @submit.prevent="submitEnrollment">
        <label for="enrollment-student">Student</label>
        <select id="enrollment-student" v-model="selectedStudentId" required>
          <option value="" disabled>Select a student</option>
          <option v-for="student in store.students" :key="student.id" :value="String(student.id)">
            {{ student.name }} ({{ student.id }})
          </option>
        </select>
        <label for="enrollment-course">Course</label>
        <select id="enrollment-course" v-model="selectedCourseId" required>
          <option value="" disabled>Select a course</option>
          <option v-for="course in store.courses" :key="course.id" :value="course.id">
            {{ course.id }} — {{ course.name }}
          </option>
        </select>
        <button class="button button-primary" type="submit" :disabled="store.loading">
          {{ store.loading ? 'Saving…' : 'Enroll student' }}
        </button>
      </form>
    </section>

    <section class="card">
      <div class="card-heading">
        <div><p class="eyebrow">ENROLLED STUDENTS</p><h2>Course roster</h2></div>
        <span class="count-badge">{{ store.roster.length }}</span>
      </div>
      <label class="roster-label" for="roster-course">Choose a course to view its roster</label>
      <select id="roster-course" v-model="selectedCourseId" :disabled="store.courses.length === 0" class="roster-select">
        <option value="">Select a course</option>
        <option v-for="course in store.courses" :key="course.id" :value="course.id">
          {{ course.id }} — {{ course.name }}
        </option>
      </select>
      <p v-if="store.loading && selectedCourseId" class="muted" role="status">Loading course roster…</p>
      <p v-else-if="!selectedCourseId" class="muted empty-copy">Select a course to see enrolled students.</p>
      <p v-else-if="!store.error && store.roster.length === 0" class="muted empty-copy">
        No students are enrolled in {{ selectedCourse?.id }} yet.
      </p>
      <ul v-else class="course-list" aria-label="Students enrolled in selected course">
        <li v-for="student in store.roster" :key="student.id" class="course-item">
          <div class="course-mark" aria-hidden="true">S</div>
          <div class="course-info">
            <strong>{{ student.name }}</strong>
            <span>Student ID: {{ student.id }} · {{ student.phone }}</span>
          </div>
        </li>
      </ul>
    </section>
  </div>
</template>
