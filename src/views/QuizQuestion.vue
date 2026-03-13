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

      <EditableImageAnswer @submit-answer-start="nextImage" :current-image-saved-data-id="currentImageSavedDataId" />
    </div>
    <div v-else class="quiz-contents">
      <p>There are no images available for you to classify.</p>
    </div>
  </div>
</template>

<script>
import { useCookies } from 'vue3-cookies'
import ReferrerDropdown from '../components/ReferrerDropdown.vue'
import EditableImageAnswer from "@/components/EditableImageAnswer.vue";

export default {
  name: "QuizQuestion",
  components: {
    ReferrerDropdown,
    EditableImageAnswer
  },
  data() {
    return {

      username: '',
      usernameOptions: [],
      images: [],
      currentImageIndex: 0,
      showReferrers: false,
      question: {
        text: "Would you classify this image as either being an advertisement or coming from an advertisement?",
        options: [
          { label: "Yes, the image is an ad or comes from an ad.", value: 1 },
          { label: "No, the image is not an ad.", value: 0 }
        ],
      },
      selectedAnswer: null,
      isFlagged: false,
      flagNotes: '',
      isAdMarker: false,
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
    currentImageSavedDataId() {
      const img = this.images[this.currentImageIndex];
      return img ? img.id : null;
    },
    currentImageFullFilepath() {
      const img = this.images[this.currentImageIndex];
      return img ? img.full_filepath : null;
    },
    currentImageText() {
      const img = this.images[this.currentImageIndex];
      if (!img) return '';
      return img.text || '';
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
    currentImageReferrerUrl() {
      const img = this.images[this.currentImageIndex];
      if (!img) return '';
      return img.website_url || '';
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
            classification_issuer: this.username,
            flag_issue: this.isFlagged,
            notes: this.flagNotes,
            is_ad_marker: this.isAdMarker,
          }),
        });
      } catch (error) {
        alert('Failed to submit answer: ' + error.message);
        return;
      }
      // Select a new image index
      this.currentImageIndex = (this.currentImageIndex + 1) % this.images.length;
    },
    async nextImage() {
      this.currentImageIndex = (this.currentImageIndex + 1) % this.images.length;
    },
    async previousImage() {
      this.currentImageIndex =
          (this.currentImageIndex - 1 + this.images.length) % this.images.length;
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

.image-counter {
  margin: 0 1rem;
}

.username-row {
  margin-top: 1em;
}

.flag-btn.active {
  background-color: #a60909;
}


.info-icon {
  position: relative;
  display: inline-block;
  cursor: help;
  color: #0074d9;
  font-weight: bold;
}

/* Tooltip container */
.tooltip-text {
  font-style: italic;
  visibility: hidden;
  width: 220px;
  background-color: #333;
  color: #fff;
  text-align: center;
  border-radius: 6px;
  padding: 8px;
  position: absolute;
  z-index: 1;
  bottom: 125%; /* Position above the icon */
  left: 50%;
  margin-left: -110px; /* Center the tooltip */
  opacity: 0;
  transition: opacity 0.3s;
  font-size: 0.8rem;
  font-weight: normal;
  line-height: 1.4;
}

/* Tooltip arrow */
.tooltip-text::after {
  content: "";
  position: absolute;
  top: 100%;
  left: 50%;
  margin-left: -5px;
  border-width: 5px;
  border-style: solid;
  border-color: #333 transparent transparent transparent;
}

/* Show the tooltip on hover */
.info-icon:hover .tooltip-text {
  visibility: visible;
  opacity: 1;
}


</style>
