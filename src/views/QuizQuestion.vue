<template>
  <div class="quiz-container">
    <div class="username-row">
      <label>
        Username:
        <select v-model="username">
          <option disabled value="">Select username</option>
          <option v-for="opt in usernameOptions" :key="opt" :value="opt">{{ opt }}</option>
        </select>
      </label>
    </div>
    <div v-if="images.length > 0" class="quiz-contents">
      <div class="nav-buttons" v-if="images.length">
        <button type="button" class="btn-nav" @click="previousImage">
          ←
        </button>
        <span class="image-counter">
            {{ currentImageIndex + 1 }} / {{ images.length }}
          </span>
        <button type="button" class="btn-nav" @click="nextImage">
          →
        </button>
      </div>

      <!-- Toggle background color link -->
      <span class="toggle-bg-link" @click="toggleBg">
        {{ isWhiteBg ? 'Switch to black background' : 'Switch to white background' }}
      </span>
      <!-- Image -->
      <div class="image-container" :class="isWhiteBg ? 'white-bg' : 'black-bg'">
        <img v-if="currentImage" :src="currentImageReencoded" alt="Quiz Image" class="question-image" />
      </div>

      <p>{{currentImageText}}</p>
      <p><em>{{currentImageTextScript}}</em></p>

      <a v-if="currentImage" :href="currentImageReencoded" target="_blank" class="image-link">Can't see? Open image in new tab</a>

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

      <div class="button-row">
        <button
            class="btn-primary"
            :disabled="selectedAnswer == null"
            @click="submitAnswer"
        >
          Submit &amp; Continue
        </button>
      </div>

      <div class="referrer-row">
        <ReferrerDropdown
            :key="currentImageIndex + '-screenshot'"
            title="Referring Website - Screenshot"
            :src="currentImageReferrerScreenshot"
        />

        <ReferrerDropdown
            :key="currentImageIndex + '-recording'"
            title="Referring Website - Screencast Recording"
            :src="currentImageReferrerRecording"
        />
      </div>
    </div>
    <div v-else class="quiz-contents">
      <p>There are no images available for you to classify.</p>
    </div>
  </div>
</template>

<script>
import { useCookies } from 'vue3-cookies'
import ReferrerDropdown from '../components/ReferrerDropdown.vue'

export default {
  name: "QuizQuestion",
  components: {
    ReferrerDropdown
  },
  data() {
    return {
      selectedAnswer: null,
      username: '',
      usernameOptions: [],
      images: [],
      currentImageIndex: 0,
      isWhiteBg: false,
      showReferrers: false,
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
      // read username cookie
      const { cookies } = useCookies();
      const saved = cookies.get('username');
      if (saved) this.username = saved;

      const imagesRequestUrl = this.username
          ? `/api/?user=${encodeURIComponent(this.username)}`
          : '/api/';
      const [questionsResponse, usernamesResponse] = await Promise.all([
        fetch(imagesRequestUrl),
        fetch('/api/user_options'),
      ]);
      const questionsResult = await questionsResponse.json();
      this.images = questionsResult.data || [];
      const usernamesResult = await usernamesResponse.json();
      this.usernameOptions = usernamesResult.data || [];


    } catch (error) {
      alert('Failed to fetch images: ' + error.message);
    }
  },
  watch: {
    // whenever username changes, store it in a cookie
    async username(newUsernameVal) {
      if (newUsernameVal) {
        const { cookies } = useCookies();
        cookies.set('username', newUsernameVal, '7d'); // expires in 7 days
      } else {
        const { cookies } = useCookies();
        cookies.remove('username');
      }
      const imagesRequestUrl = newUsernameVal
          ? `/api/?user=${encodeURIComponent(newUsernameVal)}`
          : '/api/';
      const questionsResponse = await fetch(imagesRequestUrl);
      const questionsResult = await questionsResponse.json();
      this.images = questionsResult.data || [];
    }
  },
  computed: {
    currentImage() {
      const img = this.images[this.currentImageIndex];
      if (!img) return null;
      // Use absolute URL based on current origin
      return `${window.location.origin}/api/${img.full_filepath}`;
    },
    currentImageReencoded() {
      const img = this.images[this.currentImageIndex];
      if (!img) return null;

      const full = img.full_filepath || '';
      const lastSlash = full.lastIndexOf('/');
      const head = lastSlash >= 0 ? full.slice(0, lastSlash + 1) : '';
      let filename = lastSlash >= 0 ? full.slice(lastSlash + 1) : full;

      // Try to normalize any existing percent-encoding, then re-encode the filename
      try {
        filename = encodeURIComponent(filename);
      } catch (e) {
        // If decode fails (malformed), fall back to encoding raw
        filename = encodeURIComponent(filename);
      }

      return `${window.location.origin}/api/${head}${filename}`;
    },
    currentImageText() {
      const img = this.images[this.currentImageIndex];
      if (!img) return '';
      return img.text || '';
    },
    currentImageTextScript() {
      const img = this.images[this.currentImageIndex];
      if (!img) return '';
      return img.text_script || '';
    },
    currentImageReferrerScreenshot() {
      const img = this.images[this.currentImageIndex];
      if (!img) return '';
      return `${window.location.origin}/api/${img.screenshot_filepath}`;
    },
    currentImageReferrerRecording() {
      const img = this.images[this.currentImageIndex];
      if (!img) return '';
      return `${window.location.origin}/api/${img.video_filepath}`;
    },
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
            classification_issuer: this.username
          }),
        });
      } catch (error) {
        alert('Failed to submit answer: ' + error.message);
        return;
      }
      // Select a new image index
      this.currentImageIndex = (this.currentImageIndex + 1) % this.images.length;
      this.selectedAnswer = null;
    },
    async nextImage() {
      this.currentImageIndex = (this.currentImageIndex + 1) % this.images.length;
    },
    async previousImage() {
      this.currentImageIndex =
          (this.currentImageIndex - 1 + this.images.length) % this.images.length;
    },
    toggleBg() {
      this.isWhiteBg = !this.isWhiteBg;
    }
  }
};
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

.toggle-bg-link {
  color: #0074d9;
  cursor: pointer;
  text-decoration: underline;
  display: inline-block;
  margin-bottom: 1rem;
}
.image-container.white-bg {
  background: #fff;
}
.image-container.black-bg {
  background: #000;
}
.image-container {
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
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

.image-link {
  display: block;
  margin-top: 0.5rem;
  color: #0074d9;
  text-decoration: underline;
  font-size: 0.95rem;
}

.image-counter {
  margin: 0 1rem;
}

.username-row {
  margin-top: 1em;
}


</style>
