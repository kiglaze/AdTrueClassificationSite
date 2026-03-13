<template>
  <div class="quiz-container">
    <EditableImageAnswer :current-image-saved-data-id="$route.params.id" />
  </div>
</template>

<script>
import { useCookies } from 'vue3-cookies'
import EditableImageAnswer from "@/components/EditableImageAnswer.vue";

export default {
  name: "EditPriorAnswer",
  components: {
    EditableImageAnswer
  },
  data() {
    return {
    }
  },
}
</script>

<style scoped>
.quiz-container {
  margin: 0 auto;
  text-align: center;
}

/* Larger screens: tablet and up */
@media (min-width: 600px) {
  .quiz-container {
    width: 80%;      /* 2 columns */
  }
}

/* Desktop */
@media (min-width: 1000px) {
  .quiz-container {
    width: 900px;    /* 3 columns */
  }
}
@media (min-width: 1200px) {
  .quiz-container {
    width: 1100px;    /* 3 columns */
  }
}
@media (min-width: 1400px) {
  .quiz-container {
    width: 1300px;    /* 3 columns */
  }
}
</style>
