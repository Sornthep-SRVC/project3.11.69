
<script setup>
import { ref, onMounted } from "vue";

const API_URL = "http://localhost:5000/api/evaluation-topics";

const topics = ref([]);
const dialog = ref(false);
const loading = ref(false);
const saving = ref(false);
const errorMessage = ref("");
const successMessage = ref("");
const indicatorDialog = ref(false);
const selectedTopic = ref(null);
const indicators = ref([]);
const indicatorForm = ref({
  indicator_name: "",
  description: "",
  weight: 0,
  evidence: "",
});

const form = ref({
  topic_name: "",
  description: "",
});

const editingIndicatorId = ref(null);

// โหลดหัวข้อการประเมิน
async function loadTopics() {
  loading.value = true;
  errorMessage.value = "";

  try {
    const response = await fetch(API_URL);
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "โหลดข้อมูลไม่สำเร็จ");
    }

    topics.value = result.data;
  } catch (error) {
    errorMessage.value =
      error.message || "ไม่สามารถเชื่อมต่อ Backend ได้";
  } finally {
    loading.value = false;
  }
}

// เปิดฟอร์มเพิ่มหัวข้อ
function openDialog() {
  form.value = {
    topic_name: "",
    description: "",
  };

  errorMessage.value = "";
  dialog.value = true;
}

// บันทึกหัวข้อ
async function saveTopic() {
  errorMessage.value = "";

  if (!form.value.topic_name.trim()) {
    errorMessage.value = "กรุณากรอกชื่อหัวข้อ";
    return;
  }

  saving.value = true;

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        topic_name: form.value.topic_name.trim(),
        description: form.value.description.trim(),
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "บันทึกไม่สำเร็จ");
    }

    dialog.value = false;
    successMessage.value = "เพิ่มหัวข้อการประเมินสำเร็จ";

    await loadTopics();
  } catch (error) {
    errorMessage.value =
      error.message || "ไม่สามารถบันทึกข้อมูลได้";
  } finally {
    saving.value = false;
  }
}

// โหลดตัวชี้วัดของหัวข้อ
async function loadIndicators(topic) {
  selectedTopic.value = topic;
  indicators.value = [];

  try {
    const response = await fetch(
      `http://localhost:5000/api/indicators/${topic.id}`
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "โหลดตัวชี้วัดไม่สำเร็จ");
    }

    indicators.value = result;
    indicatorForm.value = {
      indicator_name: "",
      description: "",
      weight: 0,
      evidence: "",
    };

    indicatorDialog.value = true;
  } catch (error) {
    errorMessage.value = error.message;
  }
}

// เพิ่มตัวชี้วัด
async function saveIndicator() {
  if (!indicatorForm.value.indicator_name.trim()) {
    errorMessage.value = "กรุณากรอกชื่อตัวชี้วัด";
    return;
  }

  // ลบตัวชี้วัด
async function deleteIndicator(indicator) {
  const confirmDelete = confirm(
    `ต้องการลบตัวชี้วัด "${indicator.indicator_name}" หรือไม่?`
  );

  if (!confirmDelete) return;

  try {
    const response = await fetch(
      `http://localhost:5000/api/indicators/${indicator.id}`,
      {
        method: "DELETE",
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "ลบไม่สำเร็จ");
    }

    await loadIndicators(selectedTopic.value);
  } catch (error) {
    errorMessage.value = error.message;
  }
}

  try {
    const response = await fetch(
      "http://localhost:5000/api/indicators",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topic_id: selectedTopic.value.id,
          ...indicatorForm.value,
        }),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "เพิ่มตัวชี้วัดไม่สำเร็จ");
    }

    await loadIndicators(selectedTopic.value);
  } catch (error) {
    errorMessage.value = error.message;
  }
}

// ลบตัวชี้วัด
async function deleteIndicator(indicator) {
  const confirmDelete = confirm(
    `ต้องการลบตัวชี้วัด "${indicator.indicator_name}" หรือไม่?`
  );

  if (!confirmDelete) return;

  try {
    const response = await fetch(
      `http://localhost:5000/api/indicators/${indicator.id}`,
      {
        method: "DELETE",
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "ลบไม่สำเร็จ");
    }

    await loadIndicators(selectedTopic.value);

  } catch (error) {
    errorMessage.value = error.message;
  }
}

// เปิดฟอร์มแก้ไขตัวชี้วัด
function editIndicator(indicator) {
  indicatorForm.value = {
    indicator_name: indicator.indicator_name,
    description: indicator.description || "",
    weight: Number(indicator.weight) || 0,
    evidence: indicator.evidence || "",
  };

  selectedTopic.value = selectedTopic.value;
  editingIndicatorId.value = indicator.id;
}

// บันทึกการแก้ไขตัวชี้วัด
async function updateIndicator() {
  try {
    const response = await fetch(
      `http://localhost:5000/api/indicators/${editingIndicatorId.value}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(indicatorForm.value),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "แก้ไขไม่สำเร็จ");
    }

    editingIndicatorId.value = null;

    await loadIndicators(selectedTopic.value);
  } catch (error) {
    errorMessage.value = error.message;
  }
}

onMounted(() => {
  loadTopics();
});
</script>

<template>
  <v-container fluid class="pa-8">
    <div class="d-flex align-center justify-space-between mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold">
          หัวข้อการประเมิน
        </h1>

        <p class="text-grey mt-2">
          จัดการหัวข้อการประเมินบุคลากร
        </p>
      </div>

      <v-btn
        color="primary"
        prepend-icon="mdi-plus"
        @click="openDialog"
      >
        เพิ่มหัวข้อ
      </v-btn>
    </div>

    <v-alert
      v-if="successMessage"
      type="success"
      variant="tonal"
      class="mb-4"
    >
      {{ successMessage }}
    </v-alert>

    <v-alert
      v-if="errorMessage && !dialog"
      type="error"
      variant="tonal"
      class="mb-4"
    >
      {{ errorMessage }}
    </v-alert>

    <v-card rounded="lg">
      <v-card-title class="pa-5">
        รายการหัวข้อการประเมิน
      </v-card-title>

      <v-table>
        <thead>
          <tr>
            <th>รหัส</th>
            <th>ชื่อหัวข้อ</th>
            <th>รายละเอียด</th>
            <th>จัดการ</th>
          </tr>
        </thead>

        <tbody>
          <tr v-if="loading">
            <td colspan="3" class="text-center pa-8">
              กำลังโหลดข้อมูล...
            </td>
          </tr>

          <tr v-else-if="topics.length === 0">
            <td colspan="3" class="text-center pa-8 text-grey">
              ยังไม่มีหัวข้อการประเมิน
            </td>
          </tr>

          <tr
            v-for="topic in topics"
            :key="topic.id"
          >
            <td>{{ topic.id }}</td>
            <td>{{ topic.topic_name }}</td>
            <td>{{ topic.description || "-" }}</td>
                        <td>
            <v-btn
                color="primary"
                size="small"
                variant="tonal"
                @click="loadIndicators(topic)"
            >
                จัดการตัวชี้วัด
            </v-btn>
            </td>
          </tr>
        </tbody>
      </v-table>
    </v-card>

    <!-- Dialog เพิ่มหัวข้อ -->
    <v-dialog v-model="dialog" max-width="550">
      <v-card rounded="lg">
        <v-card-title class="pa-5">
          <v-icon class="mr-2">
            mdi-clipboard-list
          </v-icon>
          เพิ่มหัวข้อการประเมิน
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
            v-model="form.topic_name"
            label="ชื่อหัวข้อ"
            placeholder="เช่น ด้านการปฏิบัติงาน"
            variant="outlined"
          />

          <v-textarea
            v-model="form.description"
            label="รายละเอียด"
            placeholder="รายละเอียดของหัวข้อการประเมิน"
            variant="outlined"
            rows="3"
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
            @click="saveTopic"
          >
            บันทึก
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog จัดการตัวชี้วัด -->
<v-dialog v-model="indicatorDialog" max-width="800">
  <v-card rounded="lg">
    <v-card-title class="pa-5">
      ตัวชี้วัด: {{ selectedTopic?.topic_name }}
    </v-card-title>

    <v-divider />

    <v-card-text class="pa-5">
      <v-text-field
        v-model="indicatorForm.indicator_name"
        label="ชื่อตัวชี้วัด"
        variant="outlined"
      />

      <v-textarea
        v-model="indicatorForm.description"
        label="รายละเอียด"
        variant="outlined"
        rows="2"
      />

      <v-text-field
        v-model.number="indicatorForm.weight"
        label="น้ำหนักคะแนน"
        type="number"
        variant="outlined"
      />

      <v-textarea
        v-model="indicatorForm.evidence"
        label="หลักฐานที่ต้องใช้"
        variant="outlined"
        rows="2"
      />

      <v-btn
        color="primary"
        block
        class="mb-5"
        @click="saveIndicator"
      >
        เพิ่มตัวชี้วัด
      </v-btn>

      <v-divider class="mb-4" />

      <h3 class="text-subtitle-1 mb-3">
        รายการตัวชี้วัด
      </h3>

      <v-table>
        <thead>
          <tr>
            <th>ชื่อตัวชี้วัด</th>
            <th>น้ำหนัก</th>
            <th>หลักฐาน</th>
            <th>จัดการ</th>
          </tr>
        </thead>

      <tbody>
  <tr v-if="indicators.length === 0">
    <td colspan="4" class="text-center">
      ยังไม่มีตัวชี้วัด
    </td>
  </tr>

  <tr
    v-for="indicator in indicators"
    :key="indicator.id"
  >
    <td>{{ indicator.indicator_name }}</td>
    <td>{{ indicator.weight }}</td>
    <td>{{ indicator.evidence || "-" }}</td>

    <td>
    <v-btn
  color="primary"
  size="small"
  variant="tonal"
  class="mr-2"
  @click="editIndicator(indicator)"
>
  แก้ไข
</v-btn>

<v-btn
  color="error"
  size="small"
  variant="tonal"
  @click="deleteIndicator(indicator)"
>
  ลบ
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
        @click="indicatorDialog = false"
      >
        ปิด
      </v-btn>
    </v-card-actions>
  </v-card>
</v-dialog>


  </v-container>
</template>
