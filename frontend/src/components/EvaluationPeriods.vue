
<script setup>
import { ref, onMounted } from "vue";

const API_URL = "http://localhost:5000/api/evaluation-periods";
const TOPICS_URL = "http://localhost:5000/api/evaluation-topics";
const PERIOD_TOPICS_URL = "http://localhost:5000/api/period-topics";

const periods = ref([]);
const topics = ref([]);
const periodTopics = ref([]);

const dialog = ref(false);
const topicDialog = ref(false);
const loading = ref(false);
const saving = ref(false);
const loadingTopics = ref(false);

const errorMessage = ref("");
const successMessage = ref("");

const selectedPeriod = ref(null);
const selectedTopicId = ref(null);

const form = ref({
  period_name: "",
  start_date: "",
  end_date: "",
  status: "draft",
});

// โหลดรอบประเมิน
async function loadPeriods() {
  loading.value = true;
  errorMessage.value = "";

  try {
    const response = await fetch(API_URL);
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "โหลดข้อมูลไม่สำเร็จ");
    }

    periods.value = result;
  } catch (error) {
    errorMessage.value = error.message;
  } finally {
    loading.value = false;
  }
}

// โหลดหัวข้อทั้งหมด
async function loadTopics() {
  try {
    const response = await fetch(TOPICS_URL);
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "โหลดหัวข้อไม่สำเร็จ");
    }

    topics.value = result.data || [];
  } catch (error) {
    errorMessage.value = error.message;
  }
}

// เปิดฟอร์มเพิ่มรอบประเมิน
function openDialog() {
  form.value = {
    period_name: "",
    start_date: "",
    end_date: "",
    status: "draft",
  };

  errorMessage.value = "";
  dialog.value = true;
}

// บันทึกรอบประเมิน
async function savePeriod() {
  errorMessage.value = "";

  if (
    !form.value.period_name.trim() ||
    !form.value.start_date ||
    !form.value.end_date
  ) {
    errorMessage.value = "กรุณากรอกข้อมูลให้ครบ";
    return;
  }

  saving.value = true;

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form.value),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "บันทึกไม่สำเร็จ");
    }

    dialog.value = false;
    successMessage.value = "เพิ่มรอบประเมินสำเร็จ";

    await loadPeriods();
  } catch (error) {
    errorMessage.value = error.message;
  } finally {
    saving.value = false;
  }
}

// เปิดหน้าจัดการหัวข้อ
async function openTopicDialog(period) {
  selectedPeriod.value = period;
  selectedTopicId.value = null;
  periodTopics.value = [];
  errorMessage.value = "";
  successMessage.value = "";

  topicDialog.value = true;

  await Promise.all([
    loadTopics(),
    loadPeriodTopics(period.id),
  ]);
}

// โหลดหัวข้อของรอบที่เลือก
async function loadPeriodTopics(periodId) {
  loadingTopics.value = true;

  try {
    const response = await fetch(
      `${PERIOD_TOPICS_URL}/${periodId}`
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "โหลดหัวข้อไม่สำเร็จ");
    }

    periodTopics.value = result;
  } catch (error) {
    errorMessage.value = error.message;
  } finally {
    loadingTopics.value = false;
  }
}

// เพิ่มหัวข้อเข้ารอบประเมิน
async function addTopic() {
  if (!selectedTopicId.value) {
    errorMessage.value = "กรุณาเลือกหัวข้อ";
    return;
  }

  try {
    const response = await fetch(PERIOD_TOPICS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        period_id: selectedPeriod.value.id,
        topic_id: selectedTopicId.value,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "เพิ่มหัวข้อไม่สำเร็จ");
    }

    selectedTopicId.value = null;
    successMessage.value = "เพิ่มหัวข้อเข้ารอบประเมินสำเร็จ";

    await loadPeriodTopics(selectedPeriod.value.id);
  } catch (error) {
    errorMessage.value = error.message;
  }
}

// ลบหัวข้อออกจากรอบประเมิน
async function removeTopic(topic) {
  const confirmDelete = confirm(
    `ต้องการนำหัวข้อ "${topic.topic_name}" ออกจากรอบประเมินนี้หรือไม่?`
  );

  if (!confirmDelete) return;

  try {
    const response = await fetch(
      `${PERIOD_TOPICS_URL}/${selectedPeriod.value.id}/${topic.id}`,
      {
        method: "DELETE",
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "ลบหัวข้อไม่สำเร็จ");
    }

    successMessage.value = "นำหัวข้อออกจากรอบประเมินสำเร็จ";

    await loadPeriodTopics(selectedPeriod.value.id);
  } catch (error) {
    errorMessage.value = error.message;
  }
}

onMounted(() => {
  loadPeriods();
});
</script>

<template>
  <v-container fluid class="pa-8">
    <div class="d-flex align-center justify-space-between mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold">
          รอบการประเมิน
        </h1>

        <p class="text-grey mt-2">
          จัดการรอบการประเมินบุคลากร
        </p>
      </div>

      <v-btn
        color="primary"
        prepend-icon="mdi-plus"
        @click="openDialog"
      >
        เพิ่มรอบประเมิน
      </v-btn>
    </div>

    <v-alert
      v-if="successMessage && !topicDialog"
      type="success"
      variant="tonal"
      class="mb-4"
    >
      {{ successMessage }}
    </v-alert>

    <v-alert
      v-if="errorMessage && !dialog && !topicDialog"
      type="error"
      variant="tonal"
      class="mb-4"
    >
      {{ errorMessage }}
    </v-alert>

    <v-card rounded="lg">
      <v-card-title class="pa-5">
        รายการรอบประเมิน
      </v-card-title>

      <v-table>
        <thead>
          <tr>
            <th>ชื่อรอบประเมิน</th>
            <th>วันเริ่มต้น</th>
            <th>วันสิ้นสุด</th>
            <th>สถานะ</th>
            <th>จัดการ</th>
          </tr>
        </thead>

        <tbody>
          <tr v-if="loading">
            <td colspan="5" class="text-center pa-8">
              กำลังโหลดข้อมูล...
            </td>
          </tr>

          <tr v-else-if="periods.length === 0">
            <td colspan="5" class="text-center pa-8 text-grey">
              ยังไม่มีรอบประเมิน
            </td>
          </tr>

          <tr
            v-for="period in periods"
            :key="period.id"
          >
            <td>{{ period.period_name }}</td>
            <td>{{ period.start_date }}</td>
            <td>{{ period.end_date }}</td>
            <td>{{ period.status }}</td>

            <td>
              <v-btn
                color="primary"
                size="small"
                variant="tonal"
                prepend-icon="mdi-format-list-bulleted"
                @click="openTopicDialog(period)"
              >
                จัดการหัวข้อ
              </v-btn>
            </td>
          </tr>
        </tbody>
      </v-table>
    </v-card>

    <!-- Dialog เพิ่มรอบประเมิน -->
    <v-dialog v-model="dialog" max-width="550">
      <v-card rounded="lg">
        <v-card-title class="pa-5">
          เพิ่มรอบประเมิน
        </v-card-title>

        <v-divider />

        <v-card-text class="pa-5">
          <v-alert
            v-if="errorMessage"
            type="error"
            variant="tonal"
            class="mb-4"
          >
            {{ errorMessage }}
          </v-alert>

          <v-text-field
            v-model="form.period_name"
            label="ชื่อรอบประเมิน"
            placeholder="เช่น รอบประเมินประจำปี 2569"
            variant="outlined"
          />

          <v-text-field
            v-model="form.start_date"
            label="วันเริ่มต้น"
            type="date"
            variant="outlined"
          />

          <v-text-field
            v-model="form.end_date"
            label="วันสิ้นสุด"
            type="date"
            variant="outlined"
          />

          <v-select
            v-model="form.status"
            label="สถานะ"
            :items="[
              { title: 'ฉบับร่าง', value: 'draft' },
              { title: 'เปิดใช้งาน', value: 'active' },
              { title: 'ปิดรอบ', value: 'closed' }
            ]"
            variant="outlined"
          />
        </v-card-text>

        <v-divider />

        <v-card-actions class="pa-5">
          <v-spacer />

          <v-btn
            variant="text"
            @click="dialog = false"
          >
            ยกเลิก
          </v-btn>

          <v-btn
            color="primary"
            :loading="saving"
            @click="savePeriod"
          >
            บันทึก
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog จัดการหัวข้อในรอบประเมิน -->
    <v-dialog v-model="topicDialog" max-width="750">
      <v-card rounded="lg">
        <v-card-title class="pa-5">
          จัดการหัวข้อ
        </v-card-title>

        <v-card-subtitle class="px-5 pb-4">
          รอบประเมิน: {{ selectedPeriod?.period_name }}
        </v-card-subtitle>

        <v-divider />

        <v-card-text class="pa-5">
          <v-alert
            v-if="errorMessage"
            type="error"
            variant="tonal"
            class="mb-4"
          >
            {{ errorMessage }}
          </v-alert>

          <v-alert
            v-if="successMessage"
            type="success"
            variant="tonal"
            class="mb-4"
          >
            {{ successMessage }}
          </v-alert>

          <div class="d-flex align-center ga-3 mb-6">
            <v-select
              v-model="selectedTopicId"
              label="เลือกหัวข้อประเมิน"
              :items="topics.map(topic => ({
                title: topic.topic_name,
                value: topic.id
              }))"
              variant="outlined"
              hide-details
              clearable
            />

            <v-btn
              color="primary"
              :disabled="!selectedTopicId"
              @click="addTopic"
            >
              เพิ่มหัวข้อ
            </v-btn>
          </div>

          <h3 class="text-subtitle-1 mb-3">
            หัวข้อที่อยู่ในรอบประเมิน
          </h3>

          <div v-if="loadingTopics" class="text-center pa-6">
            กำลังโหลดหัวข้อ...
          </div>

          <v-table v-else>
            <thead>
              <tr>
                <th>ชื่อหัวข้อ</th>
                <th>รายละเอียด</th>
                <th>จัดการ</th>
              </tr>
            </thead>

            <tbody>
              <tr v-if="periodTopics.length === 0">
                <td colspan="3" class="text-center pa-6 text-grey">
                  ยังไม่มีหัวข้อในรอบนี้
                </td>
              </tr>

              <tr
                v-for="topic in periodTopics"
                :key="topic.id"
              >
                <td>{{ topic.topic_name }}</td>
                <td>{{ topic.description || "-" }}</td>

                <td>
                  <v-btn
                    color="error"
                    size="small"
                    variant="tonal"
                    @click="removeTopic(topic)"
                  >
                    นำออก
                  </v-btn>
                </td>
              </tr>
            </tbody>
          </v-table>
        </v-card-text>

        <v-card-actions class="pa-5">
          <v-spacer />

          <v-btn
            variant="text"
            @click="topicDialog = false"
          >
            ปิด
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>
