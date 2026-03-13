import { createRouter, createWebHistory } from 'vue-router'
import QuizQuestion from '../views/QuizQuestion.vue'
import ResultsComparison from '../views/ResultsComparison.vue'
import ImageReview from "@/views/ImageReview.vue";
import FlaggedQuestions from "@/views/FlaggedQuestions.vue";
import EditPriorAnswer from "@/views/EditPriorAnswer.vue";

const routes = [
  { path: '/', name: 'QuizQuestion', component: QuizQuestion },
  { path: '/results_comparison', name: 'Results Comparison', component: ResultsComparison },
  { path: '/image_review/:id', name: 'Image Review By Id', component: ImageReview },
  { path: '/flagged_questions', name: 'Flagged Questions', component: FlaggedQuestions },
  { path: '/edit_answer/:id', name: 'Edit Prior Answer', component: EditPriorAnswer },
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
