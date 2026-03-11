import { createRouter, createWebHistory } from 'vue-router'
import QuizQuestion from '../views/QuizQuestion.vue'
import ResultsComparison from '../views/ResultsComparison.vue'
import ImageReview from "@/views/ImageReview.vue";

const routes = [
  { path: '/', name: 'QuizQuestion', component: QuizQuestion },
  { path: '/results_comparison', name: 'Results Comparison', component: ResultsComparison },
  { path: '/image_review/:id', name: 'Image Review By Id', component: ImageReview },
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
