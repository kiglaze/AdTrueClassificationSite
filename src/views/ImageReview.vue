<template>
  <div class="quiz-container">
    <br></br>
    <span class="toggle-bg-link" @click="toggleBg">
        {{ isWhiteBg ? 'Switch to black background' : 'Switch to white background' }}
      </span>
    <div class="image-container" :class="isWhiteBg ? 'white-bg' : 'black-bg'">
      <img :src="currentImageReencoded" alt="Quiz Image" class="question-image" />
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
      <p v-if="imageData">{{imageData.referrer_url}}</p>
    </div>
  </div>
</template>
<script>
import { useCookies } from 'vue3-cookies'
import ReferrerDropdown from '../components/ReferrerDropdown.vue'

export default {
  name: "ImageReview",
  components: {
    ReferrerDropdown
  },
  data() {
    return {
      imageData: [],
      isWhiteBg: false,
    }
  },
  async mounted() {
    try {
      const id = this.$route.params.id
      console.log(id)
      // read username cookie
      const {cookies} = useCookies();
      const saved = cookies.get('username');
      if (saved) this.username = saved;

      const imagesRequestUrl = '/api/img_saved_data/' + id;
      const [imageDataResponse] = await Promise.all([
        fetch(imagesRequestUrl)
      ]);
      const imageDataResult = await imageDataResponse.json();
      this.imageData = imageDataResult.data || [];


    } catch (error) {
      alert('Failed to fetch images: ' + error.message);
    }
  },
  computed: {
    currentImageReferrerScreenshot() {
      const img = this.imageData;
      if (!img) return '';
      return `${window.location.origin}/api/${img.screenshot_filepath}`;
    },
    currentImageReferrerRecording() {
      const img = this.imageData;
      if (!img) return '';
      return `${window.location.origin}/api/${img.video_filepath}`;
    },
    currentImageReencoded() {
      const img = this.imageData;
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
  },
  methods: {
    toggleBg() {
      this.isWhiteBg = !this.isWhiteBg;
    }
  }
}
</script>
<script setup lang="ts">
</script>
<style scoped>
.image-container.white-bg {
  background: #fff;
}
.image-container.black-bg {
  background: #000;
}
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
