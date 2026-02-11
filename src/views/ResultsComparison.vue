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

<script setup>
import { ref, computed, onMounted } from 'vue'

const rawData = ref([])
const loading = ref(true)
const error = ref(null)

onMounted(async () => {
  try {
    const res = await fetch('/api/results')
    if (!res.ok) {
      throw new Error(`Request failed: ${res.status}`)
    }
    const json = await res.json()
    rawData.value = json.data || json || []
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
})

function fileUrl(full) {
  if (!full) return ''
  const lastSlash = full.lastIndexOf('/')
  const head = lastSlash >= 0 ? full.slice(0, lastSlash + 1) : ''
  let filename = lastSlash >= 0 ? full.slice(lastSlash + 1) : full

  filename = encodeURIComponent(filename)

  // remove leading slashes from head so `/api/` + head doesn't become `/api//...`
  const apiPath = head.replace(/^\/+/, '')

  return `${window.location.origin}/api/${apiPath}${filename}`
}

const issuers = computed(() => {
  return [...new Set(rawData.value.map((d) => d.classification_issuer))]
})

const pivotedTable = computed(() => {
  const grouped = {}

  for (const row of rawData.value) {
    const fp = row.full_filepath
    if (!grouped[fp]) {
      grouped[fp] = { full_filepath: fp }
    }
    grouped[fp][row.classification_issuer] = row.is_suspected_ad_manual
  }

  return Object.values(grouped)
})

const agreementStats = computed(() => {
  const rows = pivotedTable.value
  const total = rows.length

  if (!total || !issuers.value.length) {
    return { total: 0, agree: 0, percentAgree: '0.0' }
  }

  let agreeCount = 0

  for (const row of rows) {
    const answers = issuers.value.map(i => row[i]).filter(a => a !== undefined)
    if (answers.length === 0) continue

    if (answers.every(a => a === answers[0])) {
      agreeCount++
    }
  }

  return {
    total,
    agree: agreeCount,
    percentAgree: ((agreeCount / total) * 100).toFixed(1)
  }
})
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
