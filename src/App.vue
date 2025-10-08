<script setup>
</script>

<template>
  <div class="quiz-container">
    <!-- Image -->
    <img v-if="currentImage" :src="currentImage" alt="Quiz Image" class="question-image" />

    <!-- Question -->
    <h2>{{ question.text }}</h2>

    <!-- Radio Buttons -->
    <div v-for="(option, index) in question.options" :key="index" class="option">
      <label>
        <input
            type="radio"
            name="answer"
            :value="option"
            v-model="selectedAnswer"
        />
        {{ option }}
      </label>
    </div>

    <!-- Submit Button -->
    <button :disabled="!selectedAnswer" @click="submitAnswer">
      Submit & Continue
    </button>
  </div>
</template>

<script>
export default {
  name: "QuizQuestion",
  data() {
    return {
      selectedAnswer: null,
      images: [],
      currentImageIndex: 100,
      question: {
        text: "Would you classify this image as either being an advertisement or coming from an advertisement?",
        options: [
          "Yes, the image is an ad or comes from an ad.",
          "No, the image is not an ad."
        ],
      },
    };
  },
  async mounted() {
    try {
      const response = await fetch('/api/');
      const result = await response.json();
      this.images = result.data || [];
    } catch (error) {
      alert('Failed to fetch images: ' + error.message);
    }
  },
  computed: {
    currentImage() {
      const img = this.images[this.currentImageIndex];
      if (!img) return null;
      return `/api/${img.full_filepath}`;
    }
  },
  methods: {
    async submitAnswer() {
      alert(`Selected answer: ${this.selectedAnswer}`);
      // Randomly select a new image index
      if (this.images.length > 1) {
        let newIndex;
        do {
          newIndex = Math.floor(Math.random() * this.images.length);
        } while (newIndex === this.currentImageIndex);
        this.currentImageIndex = newIndex;
      } else if (this.images.length === 1) {
        this.currentImageIndex = 0;
      }
      this.selectedAnswer = null;
    }
  },
};
</script>

<style scoped>
.quiz-container {
  max-width: 500px;
  margin: 0 auto;
  text-align: center;
}

.question-image {
  max-width: 100%;
  margin-bottom: 1rem;
}

.option {
  margin: 0.5rem 0;
  text-align: left;
}

button {
  margin-top: 1rem;
  padding: 0.6rem 1.2rem;
  border: none;
  background: #42b983;
  color: white;
  font-weight: bold;
  border-radius: 6px;
  cursor: pointer;
}

button:disabled {
  background: #ccc;
  cursor: not-allowed;
}
</style>
