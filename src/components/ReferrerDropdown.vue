<!-- ReferrerDropdown.vue -->
<template>
  <div class="referrer-dropdown">
    <div class="dropdown-header" @click="isOpen = !isOpen">
      <span>{{ title }} - <a :href="src" target="_blank">🔗</a></span>
      <span class="arrow" :class="{ open: isOpen }">
        {{ isOpen ? '▲' : '▼' }}
      </span>
    </div>

    <div class="dropdown-content" v-show="isOpen">
      <iframe
          v-if="src"
          :src="src"
          class="ref-iframe"
      ></iframe>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ReferrerDropdown',
  props: {
    title: {
      type: String,
      required: true,
    },
    src: {
      type: String,
      default: '',
    },
    initiallyOpen: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      isOpen: this.initiallyOpen,
    };
  },
};
</script>

<style scoped>
.referrer-dropdown {
  width: 100%;
  margin: 1rem 0;
  border: 1px solid #ccc;
  border-radius: 8px;
  overflow: hidden;
  text-align: left;
}

.dropdown-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.6rem 1rem;
  background: #a9bee4;
  cursor: pointer;
  font-weight: 600;
  color: #0c0707;
}

.dropdown-content {
  padding: 0.5rem 1rem 1rem;
}

.arrow {
  transition: transform 0.2s ease;
}

.arrow.open {
  transform: rotate(0deg); /* tweak if you want rotation */
}

.ref-iframe {
  width: 100%;
  height: 700px;
  border-radius: 8px;
  border: 1px solid #ccc;
}
</style>
