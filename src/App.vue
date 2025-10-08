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
            :value="option.value"
            v-model="selectedAnswer"
        />
        {{ option.label }}
      </label>
    </div>

    <!-- Submit Button -->
    <button :disabled="(selectedAnswer == null)" @click="submitAnswer">
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
          { label: "Yes, the image is an ad or comes from an ad.", value: 1 },
          { label: "No, the image is not an ad.", value: 0 }
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
      // Use absolute URL based on current origin
      return `${window.location.origin}/api/${img.full_filepath}`;
    }
  },
  methods: {
    async submitAnswer() {
      // Call to API endpoint /api/update_classification, specifying both 'classification' and 'filepath' in the data.
      const currentImage = this.images[this.currentImageIndex];
      if (!currentImage) {
        alert('No more images to classify.');
        return;
      }
      try {
        const response = await fetch('/api/update_classification', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            classification: this.selectedAnswer,
            filepath: currentImage.full_filepath,
          }),
        });
      } catch (error) {
        alert('Failed to submit answer: ' + error.message);
        return;
      }
      // Select a new image index
      this.currentImageIndex = this.currentImageIndex + 1;
      this.selectedAnswer = null;
    }
  }
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
