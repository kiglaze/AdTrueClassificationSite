<template>
  <div class="p-4">
    <h1 class="text-2xl font-bold mb-4">Classification Agreements</h1>

    <div v-if="loading">Loading results…</div>
    <div v-else-if="error" class="text-red-600">Error: {{ error }}</div>

    <div v-else>
      <!-- Agreement stats -->
      <div class="mb-4 text-lg">
        <strong>Agreement:</strong>
        {{ agreementStats.agree }} / {{ agreementStats.total }}
        ({{ agreementStats.percentAgree }}%)
      </div>

      <!-- Table -->
      <table>
        <thead>
        <tr>
          <th
              v-for="issuer in issuers"
              :key="issuer"
          >
            {{ issuer }}
          </th>
          <th>Filepath</th>
        </tr>
        </thead>

        <tbody>
        <tr v-for="row in pivotedTable" :key="row.full_filepath">
          <td
              scope="col"
              v-for="issuer in issuers"
              :key="issuer"
          >
            {{ row[issuer] ?? '' }}
          </td>
          <td>
            <a
                :href="fileUrl(row.full_filepath)"
                target="_blank"
                rel="noopener noreferrer"
            >
              <span>
                {{ row.full_filepath }}
              </span>
            </a>
          </td>
        </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
export default {
  // 1. Data handles your reactive state
  data() {
    return {
      rawData: [],
      loading: true,
      error: null
    };
  },

  // 2. Computed handles derived values (logic based on data)
  computed: {
    issuers() {
      return [...new Set(this.rawData.map((d) => d.classification_issuer))];
    },

    pivotedTable() {
      const grouped = {};
      for (const row of this.rawData) {
        const fp = row.full_filepath;
        if (!grouped[fp]) {
          grouped[fp] = { full_filepath: fp };
        }
        grouped[fp][row.classification_issuer] = row.is_suspected_ad_manual;
      }
      return Object.values(grouped);
    },

    agreementStats() {
      const rows = this.pivotedTable;
      const total = rows.length;
      if (!total || !this.issuers.length) {
        return { total: 0, agree: 0, percentAgree: '0.0' };
      }

      let agreeCount = 0;
      for (const row of rows) {
        const answers = this.issuers.map(i => row[i]).filter(a => a !== undefined);
        if (answers.length > 0 && answers.every(a => a === answers[0])) {
          agreeCount++;
        }
      }

      return {
        total,
        agree: agreeCount,
        percentAgree: ((agreeCount / total) * 100).toFixed(1)
      };
    }
  },

  // 3. Methods handle functions/actions
  methods: {
    fileUrl(full) {
      if (!full) return '';
      const lastSlash = full.lastIndexOf('/');
      const head = lastSlash >= 0 ? full.slice(0, lastSlash + 1) : '';
      let filename = lastSlash >= 0 ? full.slice(lastSlash + 1) : full;
      filename = encodeURIComponent(filename);
      const apiPath = head.replace(/^\/+/, '');
      return `${window.location.origin}/api/${apiPath}${filename}`;
    },

    async fetchResults() {
      try {
        const res = await fetch('/api/results');
        if (!res.ok) throw new Error(`Request failed: ${res.status}`);
        const json = await res.json();
        this.rawData = json.data || json || [];
      } catch (e) {
        this.error = e.message;
      } finally {
        this.loading = false;
      }
    }
  },

  // 4. Lifecycle hooks
  mounted() {
    this.fetchResults();
  }
};
</script>

<style>
table {
  border: 1px solid #ddd;
  width: 100%;
}
th:last-child, td:last-child {
  word-wrap: break-word;
  max-width: 800px;
}
</style>
