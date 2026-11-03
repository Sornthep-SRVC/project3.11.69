
<template>
  <div class="pa-6">
    <h2 class="text-h5 mb-4">การประเมิน</h2>

    <!-- รายการงานประเมิน -->
    <v-card class="mb-6">
      <v-card-title>รายการที่ได้รับมอบหมาย</v-card-title>

      <v-card-text>
        <v-select
          v-model="selectedAssignment"
          :items="assignments"
          item-title="evaluatee_name"
          item-value="id"
          label="เลือกผู้เข้ารับการประเมิน"
          variant="outlined"
          @update:model-value="loadIndicators"
        />

        <v-alert
          v-if="assignments.length === 0"
          type="info"
          variant="tonal"
        >
          ยังไม่มีรายการประเมิน
        </v-alert>
      </v-card-text>
    </v-card>

    <!-- ตัวชี้วัด -->
    <v-card v-if="selectedAssignment">
      <v-card-title>ตัวชี้วัดและคะแนน</v-card-title>

      <v-card-text>
        <v-progress-linear
          v-if="loading"
          indeterminate
        />

        <div
          v-for="indicator in indicators"
          :key="indicator.indicator_id"
          class="mb-6"
        >
          <div class="text-subtitle-1 font-weight-bold">
            {{ indicator.indicator_name }}
          </div>

          <div class="text-body-2 mb-2">
            {{ indicator.description }}
          </div>

          <div class="text-caption mb-3">
            น้ำหนัก: {{ indicator.weight }}
          </div>

          <div class="text-caption mb-3">
            หลักฐาน: {{ indicator.evidence || "-" }}
          </div>

          <v-text-field
            v-model="indicator.score"
            label="คะแนน"
            type="number"
            min="0"
            variant="outlined"
          />

          <v-textarea
            v-model="indicator.comment"
            label="ความคิดเห็น"
            rows="2"
            variant="outlined"
          />

          <v-btn
            color="primary"
            :loading="savingId === indicator.indicator_id"
            @click="saveScore(indicator)"
          >
            บันทึกคะแนน
          </v-btn>

          <v-divider class="mt-6" />
        </div>

        <v-alert
          v-if="!loading && indicators.length === 0"
          type="warning"
          variant="tonal"
        >
          ไม่พบตัวชี้วัดในรอบประเมินนี้
        </v-alert>
      </v-card-text>
    </v-card>

    <v-snackbar v-model="snackbar" :color="snackbarColor">
      {{ snackbarText }}
    </v-snackbar>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import axios from "axios";

const assignments = ref([]);
const indicators = ref([]);

const selectedAssignment = ref(null);
const loading = ref(false);
const savingId = ref(null);

const snackbar = ref(false);
const snackbarText = ref("");
const snackbarColor = ref("success");

const API_URL = "http://localhost:5000/api";

function showMessage(message, color = "success") {
  snackbarText.value = message;
  snackbarColor.value = color;
  snackbar.value = true;
}

// ดึงรายการที่ได้รับมอบหมาย
async function loadAssignments() {
  try {
    const token = localStorage.getItem("token");
    console.log("TOKEN:", token);

    const response = await axios.get(
      `${API_URL}/assignments`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    assignments.value = response.data.map((item) => ({
      ...item,
      evaluatee_name:
        `${item.evaluatee_first_name} ${item.evaluatee_last_name}`,
    }));
  } catch (error) {
    console.error(error);
    showMessage("ไม่สามารถโหลดรายการประเมินได้", "error");
  }
}


async function loadIndicators() {
  if (!selectedAssignment.value) {
    indicators.value = [];
    return;
  }

  loading.value = true;

  try {
    const response = await axios.get(
      `${API_URL}/scores/${selectedAssignment.value}`
    );

    indicators.value = response.data.map((item) => ({
      ...item,
      score: item.score ?? "",
      comment: item.comment ?? "",
    }));
  } catch (error) {
    console.error(error);
    showMessage("ไม่สามารถโหลดตัวชี้วัดได้", "error");
  } finally {
    loading.value = false;
  }
}

// บันทึกคะแนน
async function saveScore(indicator) {
  if (
    indicator.score === "" ||
    indicator.score === null ||
    Number(indicator.score) < 0
  ) {
    showMessage("กรุณากรอกคะแนนให้ถูกต้อง", "error");
    return;
  }

  savingId.value = indicator.indicator_id;

  try {
    await axios.post(`${API_URL}/scores`, {
      assignment_id: selectedAssignment.value,
      indicator_id: indicator.indicator_id,
      score: Number(indicator.score),
      comment: indicator.comment,
    });

    showMessage("บันทึกคะแนนสำเร็จ");
  } catch (error) {
    console.error(error);
    showMessage(
      error.response?.data?.message || "ไม่สามารถบันทึกคะแนนได้",
      "error"
    );
  } finally {
    savingId.value = null;
  }
}

onMounted(() => {
  loadAssignments();
});
</script>
