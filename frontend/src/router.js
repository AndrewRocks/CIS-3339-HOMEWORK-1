import { createRouter, createWebHistory } from 'vue-router';
import StudentsView from './views/StudentsView.vue';
import CoursesView from './views/CoursesView.vue';
import EnrollmentsView from './views/EnrollmentsView.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'students', component: StudentsView },
    { path: '/courses', name: 'courses', component: CoursesView },
    { path: '/enrollments', name: 'enrollments', component: EnrollmentsView },
    { path: '/:pathMatch(.*)*', redirect: '/' }
  ],
  scrollBehavior() {
    return { top: 0 };
  }
});

export default router;
