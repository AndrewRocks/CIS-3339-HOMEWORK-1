import { defineStore } from 'pinia';
import { ref } from 'vue';
import { apiRequest } from '../api';

export const useStudentsStore = defineStore('students', () => {
  const student = ref(null);
  const loading = ref(false);
  const error = ref('');
  const message = ref('');

  async function search(name) {
    loading.value = true;
    error.value = '';
    message.value = '';
    student.value = null;
    try {
      student.value = await apiRequest('/find-student', {
        method: 'POST',
        body: JSON.stringify({ name })
      });
    } catch (requestError) {
      error.value = requestError.message;
    } finally {
      loading.value = false;
    }
  }

  async function add(details) {
    loading.value = true;
    error.value = '';
    message.value = '';
    try {
      await apiRequest('/add-student', {
        method: 'POST',
        body: JSON.stringify(details)
      });
      message.value = 'Student added successfully.';
      return true;
    } catch (requestError) {
      error.value = requestError.message;
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function remove(name) {
    loading.value = true;
    error.value = '';
    message.value = '';
    try {
      await apiRequest('/delete-student', {
        method: 'POST',
        body: JSON.stringify({ name })
      });
      if (student.value?.name === name) {
        student.value = null;
      }
      message.value = 'Student deleted successfully.';
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

  return { student, loading, error, message, search, add, remove, clearFeedback };
});
