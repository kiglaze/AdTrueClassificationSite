import { createRouter, createWebHistory } from 'vue-router'
import QuizQuestion from '../views/QuizQuestion.vue'
import ResultsComparison from '../views/ResultsComparison.vue'

const routes = [
  { path: '/', name: 'QuizQuestion', component: QuizQuestion },
  { path: '/results_comparison', name: 'Results Comparison', component: ResultsComparison }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
