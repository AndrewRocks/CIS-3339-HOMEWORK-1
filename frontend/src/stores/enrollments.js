import { defineStore } from 'pinia';
import { ref } from 'vue';
import { apiRequest } from '../api';

export const useEnrollmentsStore = defineStore('enrollments', () => {
  const students = ref([]);
  const courses = ref([]);
  const roster = ref([]);
  const loading = ref(false);
  const error = ref('');
  const message = ref('');
  const selectedCourseId = ref('');

  async function loadOptions() {
    loading.value = true;
    error.value = '';
    try {
      [students.value, courses.value] = await Promise.all([
        apiRequest('/students'),
        apiRequest('/courses')
      ]);
    } catch (requestError) {
      error.value = requestError.message;
    } finally {
      loading.value = false;
    }
  }

  async function loadRoster(courseId) {
    selectedCourseId.value = courseId;
    roster.value = [];
    error.value = '';
    message.value = '';
    if (!courseId) {
      return;
    }

    loading.value = true;
    try {
      roster.value = await apiRequest(`/enrollments?courseId=${encodeURIComponent(courseId)}`);
    } catch (requestError) {
      error.value = requestError.message;
    } finally {
      loading.value = false;
    }
  }

  async function enroll(studentId, courseId) {
    loading.value = true;
    error.value = '';
    message.value = '';
    try {
      await apiRequest('/enrollments', {
        method: 'POST',
        body: JSON.stringify({ studentId, courseId })
      });
      message.value = 'Student enrolled successfully.';
      if (selectedCourseId.value === courseId) {
        await loadRoster(courseId);
      }
      return true;
    } catch (requestError) {
      error.value = requestError.message;
      return false;
    } finally {
      loading.value = false;
    }
  }

  return {
    students,
    courses,
    roster,
    loading,
    error,
    message,
    selectedCourseId,
    loadOptions,
    loadRoster,
    enroll
  };
});
