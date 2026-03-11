<template>
  <div class="p-4">
    <h1 class="text-2xl font-bold mb-4">Classification Agreements</h1>

    <div v-if="loading">Loading results…</div>
    <div v-else-if="error" class="text-red-600">Error: {{ error }}</div>

    <div v-else>
      <!-- Agreement stats -->
      <div class="mb-4 text-lg" v-if="isRoundComplete">
        <strong>Agreement for overlapping questions:</strong>
        {{ agreementStats.agree }} / {{ agreementStats.total }}
        ({{ agreementStats.percentAgree }}%)
      </div>

      <ul>
        <li v-for="issuer in issuers" :key="issuer">
          {{ issuer }} <span v-if="issuerTotalCounts && issuerAnsweredCounts && issuerTotalCounts[issuer] && issuerAnsweredCounts[issuer]">Answered {{issuerAnsweredCounts[issuer]}} / {{issuerTotalCounts[issuer]}}</span>
          <div class="runner-container">
            <label>Round Progress: {{ (100 * issuerAnsweredCounts[issuer] / issuerTotalCounts[issuer]) }}%</label>

            <div class="slider-wrapper" v-if="issuerTotalCounts && issuerAnsweredCounts && issuerTotalCounts[issuer] && issuerAnsweredCounts[issuer]">
              <div class="track">
                <div class="fill" :style="{ width: (100 * issuerAnsweredCounts[issuer] / issuerTotalCounts[issuer]) + '%' }"></div>

                <div
                    class="runner"
                    :style="{ left: (100 * issuerAnsweredCounts[issuer] / issuerTotalCounts[issuer]) + '%' }"
                    :class="{ 'is-running': issuerAnsweredCounts[issuer] > 0 && issuerAnsweredCounts[issuer] < issuerTotalCounts[issuer] }"
                >
                  <div class="icon-flip">🏃‍➡️</div>
                  <div class="dust-cloud" v-if="issuerAnsweredCounts[issuer] > 0 && issuerAnsweredCounts[issuer] < issuerTotalCounts[issuer]"></div>
                </div>
              </div>

              <input
                  type="range"
                  min="0"
                  :max="issuerTotalCounts[issuer]"
                  class="real-input"
              />
            </div>
          </div>
        </li>
      </ul>

      <!-- Table -->
      <table v-if="isRoundComplete">
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
                :href="'/image_review/' + row.id"
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
      error: null,
      issuerTotalCounts: {},
      issuerAnsweredCounts: {},
      isRoundComplete: false,
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
          grouped[fp] = { full_filepath: fp, id: row.id };
        }
        grouped[fp][row.classification_issuer] = row.is_suspected_ad_manual;
      }
      const rows = Object.values(grouped);
      const countAnswers = (row) =>
          this.issuers.filter(issuer => row[issuer] !== undefined && row[issuer] !== null).length;

      return rows.sort((a, b) => countAnswers(b) - countAnswers(a));
    },

    agreementStats() {
      const rows = this.pivotedTable;
      const numIssuers = this.issuers.length;

      if (!rows.length || !numIssuers) {
        return { total: 0, agree: 0, percentAgree: '0.0' };
      }

      // 1. Filter rows to only include those where EVERY issuer has an entry
      const completedRows = rows.filter(row => {
        const answers = this.issuers.map(i => row[i]);
        // Check that none of the answers are undefined or null
        return answers.every(a => a !== undefined && a !== null);
      });

      const total = completedRows.length;
      if (total === 0) {
        return { total: 0, agree: 0, percentAgree: '0.0' };
      }

      // 2. Count agreements among the completed rows
      let agreeCount = 0;
      for (const row of completedRows) {
        const answers = this.issuers.map(i => row[i]);
        // Since we filtered, we know all issuers answered; now check if they are identical
        if (answers.every(a => a === answers[0])) {
          agreeCount++;
        }
      }

      return {
        total,
        agree: agreeCount,
        percentAgree: ((agreeCount / total) * 100).toFixed(1)
      };
    },

    isRoundComplete() {
      // If we haven't even loaded issuers yet, it's not complete
      if (this.issuers.length === 0) return false;

      return this.issuers.every(issuer => {
        const total = this.issuerTotalCounts[issuer];
        const answered = this.issuerAnsweredCounts[issuer];

        // Ensure both values exist and are equal
        // We use > 0 to ensure we aren't completing on uninitialized data
        return total !== undefined &&
            answered !== undefined &&
            total > 0 &&
            answered === total;
      });
    }
  },

  watch: {
    // This runs whenever the 'issuers' list changes
    issuers(newIssuers) {
      if (newIssuers.length > 0) {
        for (let i = 0; i < newIssuers.length; i++) {
          let userString = newIssuers[i];
          this.fetchIssuerTotalCounts(newIssuers)
          this.fetchIssuerAnsweredCounts(newIssuers)
        }

      }
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
    },

    async fetchIssuerTotalCounts(issuerList) {
      try {
        // Making concurrent API calls for each issuer
        const requests = issuerList.map(issuer =>
            fetch(`/api/count_total_questions?user=${encodeURIComponent(issuer)}`)
                .then(async (res) => {
                  const data = await res.json();
                  // Return an object containing both the name and the count
                  return { issuer, count: data.count };
                })
        );

        const results = await Promise.all(requests);

        for (const result of results) {
          this.issuerTotalCounts[result.issuer] = result.count;
        }
      } catch (e) {
        console.error("Failed to fetch issuer total count details:", e);
      }
    },

    async fetchIssuerAnsweredCounts(issuerList) {
      try {
        // Making concurrent API calls for each issuer
        const requests = issuerList.map(issuer =>
            fetch(`/api/count_answered_questions?user=${encodeURIComponent(issuer)}`)
                .then(async (res) => {
                  const data = await res.json();
                  // Return an object containing both the name and the count
                  return { issuer, count: data.count };
                })
        );

        const results = await Promise.all(requests);

        for (const result of results) {
          this.issuerAnsweredCounts[result.issuer] = result.count;
        }
      } catch (e) {
        console.error("Failed to fetch issuer total count details:", e);
      }
    },
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


.runner-container {
  width: 100%;
  max-width: 500px;
  padding: 1rem;
  font-family: sans-serif;
}

.slider-wrapper {
  position: relative;
  height: 50px;
  display: flex;
  align-items: center;
  margin-top: 20px;
}

.track {
  position: relative;
  width: 100%;
  height: 12px;
  background: #e0e0e0;
  border-radius: 10px;
  overflow: visible; /* Important so the man isn't cut off */
}

.fill {
  height: 100%;
  background: linear-gradient(90deg, #4facfe 0%, #00f2fe 100%);
  border-radius: 10px;
  transition: width 0.1s ease-out;
}

.runner {
  position: absolute;
  top: -35px; /* Position him above the bar */
  font-size: 30px;
  transition: left 0.1s ease-out;
  transform: translateX(-50%); /* Center the icon on the point */
  user-select: none;
  pointer-events: none;
}

/* The Running Animation */
.is-running .icon-flip {
  animation: run-wiggle 0.3s infinite alternate;
}

@keyframes run-wiggle {
  0% { transform: translateY(0) rotate(-5deg); }
  100% { transform: translateY(-5px) rotate(10deg); }
}

/* Invisible range input overlaid on top to handle dragging */
.real-input {
  position: absolute;
  width: 100%;
  height: 40px;
  opacity: 0;
  cursor: pointer;
  z-index: 2;
}

/* Optional: Fun dust cloud effect */
.dust-cloud {
  position: absolute;
  bottom: 0;
  left: -10px;
  width: 10px;
  height: 10px;
  background: rgba(0,0,0,0.1);
  border-radius: 50%;
  animation: dust 0.5s infinite;
}

@keyframes dust {
  0% { opacity: 1; transform: scale(1) translateX(0); }
  100% { opacity: 0; transform: scale(2) translateX(-20px); }
}

</style>
