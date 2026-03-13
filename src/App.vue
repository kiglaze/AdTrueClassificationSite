<template>
  <div class="app-content">
    <router-view />
  </div>
  <nav class="bottom-nav">
    <router-link to="/">Quiz Questions</router-link> |
    <router-link to="/results_comparison">Results Comparison</router-link> |
    <router-link to="/flagged_questions">Flagged Questions</router-link>
  </nav>
</template>

<script>
export default {}
</script>


<style scoped>
.app-content {
  padding-bottom: 64px; /* reserve space for the fixed bottom nav */
}

.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #5f76a1;
  border-top: 1px solid #e5e7eb;
  padding: 0 16px;
  box-shadow: 0 -2px 6px rgba(0,0,0,0.05);
  z-index: 1000;
}

.bottom-nav a {
  margin: 0 8px;
  color: inherit;
  text-decoration: none;
}
</style>