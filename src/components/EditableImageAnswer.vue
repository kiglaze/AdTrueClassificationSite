<template>
  <!-- Toggle background color link -->
  <span class="toggle-bg-link" @click="toggleBg">
        {{ isWhiteBg ? 'Switch to black background' : 'Switch to white background' }}
      </span>
  <!-- Image -->
  <div class="image-container" :class="isWhiteBg ? 'white-bg' : 'black-bg'">
    <img v-if="currentImageFullFilepath" :src="currentImageReencoded" alt="Quiz Image" class="question-image" />
  </div>
  <p>{{ text }}</p>
  <a v-if="currentImageFullFilepath" :href="currentImageReencoded" target="_blank" class="image-link">Can't see? Open image in new tab</a>
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
  <div class="referrer-row">
    <ReferrerDropdown
        key="screenshot"
        title="Referring Website - Screenshot"
        :src="currentImageReferrerScreenshot"
    />

    <ReferrerDropdown
        key="recording"
        title="Referring Website - Screencast Recording"
        :src="currentImageReferrerRecording"
    />
    <p>{{currentImageReferrerUrl}}</p>
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
</template>

<script>
import ReferrerDropdown from "@/components/ReferrerDropdown.vue";
import { useCookies } from 'vue3-cookies'
const {cookies} = useCookies();

export default {
  name: 'EditableImageAnswer',
  components: {ReferrerDropdown},
  props: {
    currentImageSavedDataId: {
      type: Number,
      required: false,
    },
    currentImageSavedData: {
      type: Object,
      required: false,
    },
    isPreloaded: {
      type: Boolean,
      required: false,
      default: false,
    }
  },
  data() {
    return {
      isWhiteBg: false,
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
      questionResultData: null,
      currentImageFullFilepath: '',
      currentImageReferrerScreenshot: '',
      currentImageReferrerRecording: '',
      currentImageReferrerUrl: '',

    };
  },
  computed: {
    currentImageReencoded() {

      const full = this.currentImageFullFilepath || '';
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
  },
  methods: {
    toggleBg() {
      this.isWhiteBg = !this.isWhiteBg;
    },
    resetAnswer() {
      this.selectedAnswer = null;
      this.isFlagged = false;
      this.flagNotes = '';
      this.isAdMarker = false;
    },
    async submitAnswer() {
      this.$emit("submit-answer-start");
      // Call to API endpoint /api/update_classification, specifying both 'classification' and 'filepath' in the data.
      if (!this.currentImageFullFilepath) {
        alert('No more images to classify.');
        return;
      }
      try {
        const saved_username = cookies.get('username');
        const response = await fetch('/api/update_classification', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            classification: this.selectedAnswer,
            filepath: this.currentImageFullFilepath,
            classification_issuer: saved_username,
            flag_issue: this.isFlagged,
            notes: this.flagNotes,
            is_ad_marker: this.isAdMarker,
          }),
        });
      } catch (error) {
        alert('Failed to submit answer: ' + error.message);
        return;
      }
    },
  },
  async mounted() {
    try {
      // read username cookie
      const saved_username = cookies.get('username');
      if (saved_username) {
        const imagesRequestUrl = `/api/img_truth_and_saved/${this.currentImageSavedDataId}?user=${encodeURIComponent(saved_username)}`;
        const [questionsResponse] = await Promise.all([
          fetch(imagesRequestUrl)
        ]);
        const questionsResult = await questionsResponse.json();
        this.questionResultData = questionsResult.data || [];
      }



    } catch (error) {
      alert('Failed to fetch image: ' + error.message);
    }
  },
  watch: {
    async currentImageSavedDataId(newCurrentImageSavedDataId) {
      if (!this.isPreloaded) {
        try {
          // read username cookie
          const saved_username = cookies.get('username');
          if (saved_username) {
            const imagesRequestUrl = `/api/img_truth_and_saved/${newCurrentImageSavedDataId}?user=${encodeURIComponent(saved_username)}`;
            const [questionsResponse] = await Promise.all([
              fetch(imagesRequestUrl)
            ]);
            const questionsResult = await questionsResponse.json();
            this.questionResultData = questionsResult.data || [];
          }
        } catch (error) {
          alert('Failed to fetch image: ' + error.message);
        }
      }

    },
    async currentImageSavedData(newCurrentImageSavedData) {
      if (newCurrentImageSavedData) {
        this.questionResultData = newCurrentImageSavedData;
      }
    },
    async questionResultData(newQuestionResultData) {
      this.currentImageFullFilepath = newQuestionResultData?.full_filepath ? newQuestionResultData.full_filepath : '';
      this.currentImageReferrerScreenshot = newQuestionResultData?.screenshot_filepath ? `${window.location.origin}/api/${newQuestionResultData.screenshot_filepath}` : '';
      this.currentImageReferrerRecording = newQuestionResultData?.video_filepath ? `${window.location.origin}/api/${newQuestionResultData.video_filepath}` : '';
      this.currentImageReferrerUrl = newQuestionResultData.referrer_url || '';
      this.text = newQuestionResultData?.text;
      this.selectedAnswer = newQuestionResultData?.is_suspected_ad_manual;
      this.isFlagged = newQuestionResultData?.flag_issue || false;
      this.isAdMarker = newQuestionResultData?.is_ad_marker == 1 ? true : false;
      this.flagNotes = newQuestionResultData?.notes && newQuestionResultData?.flag_issue ? newQuestionResultData.notes : '';
    }
  }
};
</script>
<style scoped>
.white-bg {
  background: #fff;
}
.black-bg {
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
.image-link {
  display: block;
  margin-top: 0.5rem;
  color: #0074d9;
  text-decoration: underline;
  font-size: 0.95rem;
}
.option {
  margin: 0.5rem 0;
  text-align: left;
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
.info-icon:hover .tooltip-text {
  visibility: visible;
  opacity: 1;
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
.button-row {
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;

}
.button-row-item {
  order: 4;
  align-self: flex-end;
}
.flag-btn.active {
  background-color: #a60909;
}

</style>
