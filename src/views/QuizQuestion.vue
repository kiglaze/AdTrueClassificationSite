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

      <div class="options-group">
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
        <div class="field-wrapper">
          <label>
            <input
                type="checkbox"
                v-model="isAdMarker"
                @click="isAdMarker = !isAdMarker"
            />
            Is image an "ad marker"?
            <span class="info-icon">
                ⓘ
                <span class="tooltip-text">
                  Check if this image is an "ad marker", such as an "AdChoice" label, that indicates the image is an ad but isn't itself an ad.
                </span>
              </span>
          </label>
        </div>

      </div>

      <div class="additional-options">


      </div>

      <div class="button-row">
        <button
            class="button-row-item btn-primary submit-btn"
            :disabled="selectedAnswer == null"
            @click="submitAnswer"
        >
          Submit &amp; Continue
        </button>
        <div class="button-row-item field-wrapper field-wrapper-flag">
          <div class="field-wrapper-flag">
            <button
                type="button"
                class="flag-btn"
                :class="{ 'active': isFlagged }"
                @click="isFlagged = !isFlagged"
            >
              ⚑
            </button>
            <label>Flag Image?</label>
            <span class="info-icon">
              ⓘ
              <span class="tooltip-text">
                Flag if there is an issue with the image, such as it being corrupted, confusing, or otherwise problematic. You can provide additional details in the text box that appears when you flag an image.
              </span>
            </span>
          </div>
          <textarea
              v-if="isFlagged"
              type="textarea"
              v-model="flagNotes"
              placeholder="Why are you flagging this?"
              class="flag-input"
          />
        </div>
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
      <p>{{currentImageReferrerUrl}}</p>
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
    currentImageReferrerUrl() {
      const img = this.images[this.currentImageIndex];
      if (!img) return '';
      return img.website_url || '';
    },
  },
  methods: {
    resetAnswer() {
      this.selectedAnswer = null;
      this.isFlagged = false;
      this.flagNotes = '';
      this.isAdMarker = false;
    },
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
      this.resetAnswer();
    },
    async nextImage() {
      this.currentImageIndex = (this.currentImageIndex + 1) % this.images.length;
      this.resetAnswer();
    },
    async previousImage() {
      this.currentImageIndex =
          (this.currentImageIndex - 1 + this.images.length) % this.images.length;
      this.resetAnswer();
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

.flag-btn.active {
  background-color: #a60909;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
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

.flag-btn {
  background-color: #f1f1f1;
  color: #666;
  border: 1px solid #ddd;
  font-size: 1.2rem;
  padding: 4px 10px;
  transition: all 0.2s ease;
  width: fit-content;
}

.flag-btn.active {
  background-color: #ffebeb;
  color: #e74c3c;
  border-color: #e74c3c;
}

.flag-input {
  width: 100%;
  max-width: 500px;
  min-height: 80px;
  padding: 12px;
  border: 2px solid #eee;
  border-radius: 8px;
  font-family: inherit;
  font-size: 0.95rem;
  resize: vertical; /* Allows user to grow height, but not width */
  transition: border-color 0.3s, box-shadow 0.3s;
  outline: none;
}

.flag-input:focus {
  border-color: #42b983; /* Matches your primary button color */
  box-shadow: 0 0 8px rgba(66, 185, 131, 0.2);
}

.flag-input::placeholder {
  color: #aaa;
  font-style: italic;
}

.additional-options {
  margin: 0rem 2rem;
  display: flex;
  flex-direction: row;
  justify-content: space-evenly;
  align-items: center;
}

.field-wrapper {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 12px;
  margin: 0rem 0;
  padding: 0rem;
  width: 40%;
}
.field-wrapper-flag {
  display: flex;
  align-items: center; /* keep button + label + icon on one row */
  gap: 12px;
  flex-wrap: wrap;     /* allow children to wrap to next line */
  padding: 0rem 1rem;
}
.field-wrapper-flag button{
  margin-top: 0;
}

.button-row {
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;

}
.button-row-item {
  order: 4;
  align-self: flex-end;
}

</style>
