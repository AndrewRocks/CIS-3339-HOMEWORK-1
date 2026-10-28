import { defineStore } from 'pinia';
import { ref } from 'vue';
import { apiRequest } from '../api';

export const useCoursesStore = defineStore('courses', () => {
  const courses = ref([]);
  const loading = ref(false);
  const error = ref('');
  const message = ref('');

  async function load() {
    loading.value = true;
    error.value = '';
    try {
      courses.value = await apiRequest('/courses');
    } catch (requestError) {
      error.value = requestError.message;
    } finally {
      loading.value = false;
    }
  }

  async function add(course) {
    loading.value = true;
    error.value = '';
    message.value = '';
    try {
      await apiRequest('/courses', {
        method: 'POST',
        body: JSON.stringify(course)
      });
      await load();
      message.value = 'Course added successfully.';
      return true;
    } catch (requestError) {
      error.value = requestError.message;
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function remove(id) {
    loading.value = true;
    error.value = '';
    message.value = '';
    try {
      await apiRequest(`/courses/${encodeURIComponent(id)}`, { method: 'DELETE' });
      courses.value = courses.value.filter((course) => course.id !== id);
      message.value = 'Course deleted successfully.';
      return true;
    } catch (requestError) {
      error.value = requestError.message;
      return false;
    } finally {
      loading.value = false;
    }
  }

  function clearFeedback() {
    error.value = '';
    message.value = '';
  }

  return { courses, loading, error, message, load, add, remove, clearFeedback };
});
