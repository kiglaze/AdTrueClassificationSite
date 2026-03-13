<script>
import { useCookies } from 'vue3-cookies'
export default {
  // 1. Data handles your reactive state
  data() {
    return {
      rawFlaggedJsonData: [],
      loading: true,
      error: null,
      username: '',
    };
  },
  methods: {
    async fetchFlagged() {
      try {
        const res = await fetch(`/api/find_flagged?user=${encodeURIComponent(this.username)}`);
        if (!res.ok) throw new Error(`Request failed: ${res.status}`);
        const json = await res.json();
        this.rawFlaggedJsonData = json.data || json || [];
      } catch (e) {
        this.error = e.message;
      } finally {
        this.loading = false;
      }
    },
  },
  mounted() {
    const {cookies} = useCookies();
    const saved = cookies.get('username');
    if (saved) this.username = saved;
    this.fetchFlagged();
  }
};

</script>

<template>
<div class="p-4">
  <h1 class="text-2xl font-bold mb-4">Flagged Questions</h1>

  <div v-if="loading">Loading results…</div>
  <div v-else-if="error" class="text-red-600">Error: {{ error }}</div>


  <div v-else class="overflow-x-auto">
    <table v-if="rawFlaggedJsonData.length > 0" class="min-w-full border-collapse border border-gray-200">
      <thead class="bg-gray-100">
        <tr>
          <th class="border border-gray-200 px-4 py-2 text-left">File Path</th>
          <th class="border border-gray-200 px-4 py-2 text-left">User</th>
          <th class="border border-gray-200 px-4 py-2 text-left">Classification</th>
          <th class="border border-gray-200 px-4 py-2 text-left">Notes</th>
          <th class="border border-gray-200 px-4 py-2 text-left">Edit</th>
        </tr>
      </thead>
      <tbody>
      <tr v-for="(item, index) in rawFlaggedJsonData" :key="index" class="hover:bg-gray-50">
        <td class="border border-gray-200 px-4 py-2">
          <a
              :href="`/image_review/${item.img_saved_data_id}`"
              class="text-blue-600 hover:underline font-medium"
          >
            {{ item.full_filepath }}
          </a>
        </td>
        <td class="border border-gray-200 px-4 py-2 text-gray-600">
          {{ item.classification_issuer || '—' }}
        </td>
        <td class="border border-gray-200 px-4 py-2 text-gray-600">
          {{ item.is_suspected_ad_manual === 1 ? 'Ad' : (item.is_suspected_ad_manual === 0 ? 'Not Ad' : '—') }}
        </td>
        <td class="border border-gray-200 px-4 py-2 text-gray-600">
          {{ item.notes || '—' }}
        </td>
        <td class="border border-gray-200 px-4 py-2 text-gray-600">
          ✏️
        </td>
      </tr>
      </tbody>
    </table>

    <p v-else class="mt-4 text-gray-500">
      No flagged items found.
    </p>
  </div>



</div>

</template>

<style scoped>

</style>
