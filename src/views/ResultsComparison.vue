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
      <table class="table-auto border-collapse border border-gray-400 text-sm w-full">
        <thead>
        <tr>
          <th class="border px-2 py-1 text-left">Filepath</th>
          <th
              v-for="issuer in issuers"
              :key="issuer"
              class="border px-2 py-1 text-center"
          >
            {{ issuer }}
          </th>
        </tr>
        </thead>

        <tbody>
        <tr v-for="row in pivotedTable" :key="row.full_filepath">
          <td class="border px-2 py-1 break-all">
            {{ row.full_filepath }}
          </td>
          <td
              v-for="issuer in issuers"
              :key="issuer"
              class="border px-2 py-1 text-center"
              :class="{
                'bg-green-100': row[issuer] === 0,
                'bg-red-100': row[issuer] === 1
              }"
          >
            {{ row[issuer] ?? '' }}
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
