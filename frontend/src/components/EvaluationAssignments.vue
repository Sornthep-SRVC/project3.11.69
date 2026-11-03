<script setup>
import { ref, onMounted } from "vue";

const API_URL = "http://localhost:5000/api";

const assignments = ref([]);
const periods = ref([]);
const employees = ref([]);

const loading = ref(false);
const saving = ref(false);
const errorMessage = ref("");
const successMessage = ref("");

const dialog = ref(false);

const form = ref({
  period_id: "",
  evaluator_id: "",
  evaluatee_id: "",
});

async function fetchData() {
  loading.value = true;
  errorMessage.value = "";

  try {
    const [assignmentRes, periodRes, employeeRes] =
      await Promise.all([
        fetch(`${API_URL}/assignments`),
        fetch(`${API_URL}/evaluation-periods`),
        fetch(`${API_URL}/employees`),
      ]);

    const assignmentData = await assignmentRes.json();
    const periodData = await periodRes.json();
    const employeeData = await employeeRes.json();

    if (!assignmentRes.ok) {
      throw new Error("โหลดรายการมอบหมายไม่สำเร็จ");
    }

    if (!periodRes.ok) {
      throw new Error("โหลดรอบการประเมินไม่สำเร็จ");
    }

    if (!employeeRes.ok) {
      throw new Error("โหลดข้อมูลบุคลากรไม่สำเร็จ");
    }

    assignments.value = Array.isArray(assignmentData)
      ? assignmentData
      : assignmentData.data || [];

    periods.value = Array.isArray(periodData)
      ? periodData
      : periodData.data || [];

    employees.value = Array.isArray(employeeData)
      ? employeeData
      : employeeData.data || [];

  } catch (error) {
    console.error("Fetch data error:", error);
    errorMessage.value = error.message || "ไม่สามารถโหลดข้อมูลได้";
  } finally {
    loading.value = false;
  }
}

function openDialog() {
  form.value = {
    period_id: "",
    evaluator_id: "",
    evaluatee_id: "",
  };

  successMessage.value = "";
  errorMessage.value = "";
  dialog.value = true;
}

async function saveAssignment() {
  errorMessage.value = "";
  successMessage.value = "";

  if (
    !form.value.period_id ||
    !form.value.evaluator_id ||
    !form.value.evaluatee_id
  ) {
    errorMessage.value = "กรุณาเลือกข้อมูลให้ครบ";
    return;
  }

  if (
    Number(form.value.evaluator_id) ===
    Number(form.value.evaluatee_id)
  ) {
    errorMessage.value = "ไม่สามารถประเมินตนเองได้";
    return;
  }

  saving.value = true;

  try {
    const response = await fetch(`${API_URL}/assignments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        period_id: form.value.period_id,
        evaluator_id: form.value.evaluator_id,
        evaluatee_id: form.value.evaluatee_id,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "มอบหมายไม่สำเร็จ");
    }

    dialog.value = false;
    successMessage.value = "มอบหมายผู้ประเมินสำเร็จ";

    await fetchData();
  } catch (error) {
    errorMessage.value = error.message;
  } finally {
    saving.value = false;
  }
}

async function deleteAssignment(id) {
  const confirmed = confirm("ต้องการลบรายการมอบหมายนี้หรือไม่?");

  if (!confirmed) return;

  try {
    const response = await fetch(`${API_URL}/assignments/${id}`, {
      method: "DELETE",
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "ลบไม่สำเร็จ");
    }

    successMessage.value = "ลบรายการมอบหมายสำเร็จ";

    await fetchData();
  } catch (error) {
    errorMessage.value = error.message;
  }
}

function employeeName(firstName, lastName) {
  return `${firstName || ""} ${lastName || ""}`.trim();
}

onMounted(fetchData);
</script>

<template>
  <v-container fluid class="pa-6">
    <v-row align="center" class="mb-4">
      <v-col>
        <h1 class="text-h4 font-weight-bold">
          กำหนดผู้ประเมิน
        </h1>

        <p class="text-grey mt-2">
          จัดการการมอบหมายผู้ประเมินให้แก่บุคลากร
        </p>
      </v-col>

      <v-col cols="auto">
        <v-btn
          color="indigo-darken-4"
          prepend-icon="mdi-plus"
          size="large"
          @click="openDialog"
        >
          มอบหมายผู้ประเมิน
        </v-btn>
      </v-col>
    </v-row>

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

    <v-card rounded="lg">
      <v-card-title class="pa-5">
        รายการมอบหมายผู้ประเมิน
      </v-card-title>

      <v-divider />

      <v-progress-linear
        v-if="loading"
        indeterminate
        color="indigo"
      />

      <v-table>
        <thead>
          <tr>
            <th>รอบการประเมิน</th>
            <th>ผู้ประเมิน</th>
            <th>ผู้ถูกประเมิน</th>
            <th>สถานะ</th>
            <th class="text-center">จัดการ</th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="item in assignments"
            :key="item.id"
          >
            <td>{{ item.period_name }}</td>

            <td>
              {{
                employeeName(
                  item.evaluator_first_name,
                  item.evaluator_last_name
                )
              }}
            </td>

            <td>
              {{
                employeeName(
                  item.evaluatee_first_name,
                  item.evaluatee_last_name
                )
              }}
            </td>

            <td>
              <v-chip
                color="orange"
                size="small"
              >
                {{
                  item.status === "pending"
                    ? "รอประเมิน"
                    : item.status
                }}
              </v-chip>
            </td>

            <td class="text-center">
              <v-btn
                icon="mdi-delete"
                color="red"
                variant="text"
                @click="deleteAssignment(item.id)"
              />
            </td>
          </tr>

          <tr v-if="assignments.length === 0 && !loading">
            <td colspan="5" class="text-center pa-8">
              ยังไม่มีรายการมอบหมาย
            </td>
          </tr>
        </tbody>
      </v-table>
    </v-card>

    <v-dialog
      v-model="dialog"
      max-width="600"
    >
      <v-card rounded="lg">
        <v-card-title class="pa-5">
          มอบหมายผู้ประเมิน
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

          <v-select
            v-model="form.period_id"
            :items="periods"
            item-title="period_name"
            item-value="id"
            label="รอบการประเมิน"
            variant="outlined"
          />

          <v-select
            v-model="form.evaluator_id"
            :items="employees"
            :item-title="item => employeeName(item.first_name, item.last_name)"
            item-value="id"
            label="ผู้ประเมิน"
            variant="outlined"
          />

          <v-select
            v-model="form.evaluatee_id"
            :items="employees"
            :item-title="item => employeeName(item.first_name, item.last_name)"
            item-value="id"
            label="บุคลากรที่ถูกประเมิน"
            variant="outlined"
          />
        </v-card-text>

        <v-card-actions class="pa-5">
          <v-spacer />

          <v-btn
            variant="text"
            @click="dialog = false"
          >
            ยกเลิก
          </v-btn>

          <v-btn
            color="indigo-darken-4"
            :loading="saving"
            @click="saveAssignment"
          >
            บันทึก
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>