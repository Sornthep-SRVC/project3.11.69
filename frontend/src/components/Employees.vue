
<script setup>
import { ref, onMounted } from "vue";

const API_URL = "http://localhost:5000/api/employees";

const employees = ref([]);
const dialog = ref(false);
const loading = ref(false);
const saving = ref(false);
const errorMessage = ref("");
const successMessage = ref("");
const editingId = ref(null);

const form = ref({
  first_name: "",
  last_name: "",
  email: "",
  position: "",
});

// โหลดข้อมูลบุคลากร
async function loadEmployees() {
  loading.value = true;
  errorMessage.value = "";

  try {
    const response = await fetch(API_URL);
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "โหลดข้อมูลไม่สำเร็จ");
    }

    employees.value = result.data;
  } catch (error) {
    errorMessage.value =
      error.message || "ไม่สามารถเชื่อมต่อ Backend ได้";
  } finally {
    loading.value = false;
  }
}

// เปิดฟอร์มเพิ่มบุคลากร
function openAddDialog() {
  editingId.value = null;

  form.value = {
    first_name: "",
    last_name: "",
    email: "",
    position: "",
  };

  errorMessage.value = "";
  dialog.value = true;
}

// เปิดฟอร์มแก้ไขบุคลากร
function openEditDialog(employee) {
  editingId.value = employee.id;

  form.value = {
    first_name: employee.first_name,
    last_name: employee.last_name,
    email: employee.email || "",
    position: employee.position || "",
  };

  errorMessage.value = "";
  dialog.value = true;
}

// เพิ่มหรือแก้ไขบุคลากร
async function saveEmployee() {
  errorMessage.value = "";

  if (
    !form.value.first_name.trim() ||
    !form.value.last_name.trim()
  ) {
    errorMessage.value = "กรุณากรอกชื่อและนามสกุล";
    return;
  }

  saving.value = true;

  try {
    const isEditing = editingId.value !== null;

    const url = isEditing
      ? `${API_URL}/${editingId.value}`
      : API_URL;

    const response = await fetch(url, {
      method: isEditing ? "PUT" : "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        first_name: form.value.first_name.trim(),
        last_name: form.value.last_name.trim(),
        email: form.value.email.trim(),
        position: form.value.position.trim(),
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "บันทึกไม่สำเร็จ");
    }

    dialog.value = false;

    successMessage.value = isEditing
      ? "แก้ไขข้อมูลบุคลากรสำเร็จ"
      : "เพิ่มบุคลากรสำเร็จ";

    await loadEmployees();
  } catch (error) {
    errorMessage.value =
      error.message || "ไม่สามารถบันทึกข้อมูลได้";
  } finally {
    saving.value = false;
  }
}

// ลบบุคลากร
async function deleteEmployee(employee) {
  const confirmed = window.confirm(
    `ต้องการลบ ${employee.first_name} ${employee.last_name} หรือไม่?`
  );

  if (!confirmed) return;

  errorMessage.value = "";
  successMessage.value = "";

  try {
    const response = await fetch(`${API_URL}/${employee.id}`, {
      method: "DELETE",
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "ลบข้อมูลไม่สำเร็จ");
    }

    successMessage.value = "ลบข้อมูลบุคลากรสำเร็จ";

    await loadEmployees();
  } catch (error) {
    errorMessage.value =
      error.message || "ไม่สามารถลบข้อมูลได้";
  }
}

onMounted(() => {
  loadEmployees();
});
</script>

<template>
  <v-container fluid class="pa-8">
    <!-- หัวข้อ -->
    <div class="d-flex align-center justify-space-between mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold">บุคลากร</h1>
        <p class="text-grey mt-2">
          จัดการข้อมูลบุคลากรในระบบ
        </p>
      </div>

      <v-btn
        color="primary"
        prepend-icon="mdi-plus"
        @click="openAddDialog"
      >
        เพิ่มบุคลากร
      </v-btn>
    </div>

    <!-- แจ้งเตือน -->
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

    <!-- ตารางบุคลากร -->
    <v-card rounded="lg">
      <v-card-title class="pa-5">
        รายชื่อบุคลากร
      </v-card-title>

      <v-table>
        <thead>
          <tr>
            <th>รหัส</th>
            <th>ชื่อ</th>
            <th>นามสกุล</th>
            <th>อีเมล</th>
            <th>ตำแหน่ง</th>
            <th class="text-center">จัดการ</th>
          </tr>
        </thead>

        <tbody>
          <tr v-if="loading">
            <td colspan="6" class="text-center pa-8">
              กำลังโหลดข้อมูล...
            </td>
          </tr>

          <tr v-else-if="employees.length === 0">
            <td
              colspan="6"
              class="text-center pa-8 text-grey"
            >
              ยังไม่มีข้อมูลบุคลากร
            </td>
          </tr>

          <tr
            v-for="employee in employees"
            :key="employee.id"
          >
            <td>{{ employee.id }}</td>
            <td>{{ employee.first_name }}</td>
            <td>{{ employee.last_name }}</td>
            <td>{{ employee.email || "-" }}</td>
            <td>{{ employee.position || "-" }}</td>

            <td class="text-center">
                            <v-btn
                color="primary"
                variant="flat"
                size="small"
                prepend-icon="mdi-pencil"
                @click="openEditDialog(employee)"
                >
                แก้ไข
                </v-btn>

                <v-btn
                color="error"
                variant="flat"
                size="small"
                prepend-icon="mdi-delete"
                @click="deleteEmployee(employee)"
                >
                ลบ
                </v-btn>
            </td>
          </tr>
        </tbody>
      </v-table>
    </v-card>

    <!-- Dialog เพิ่มและแก้ไข -->
    <v-dialog v-model="dialog" max-width="550">
      <v-card rounded="lg">
        <v-card-title class="pa-5">
          <v-icon class="mr-2">
            {{ editingId ? "mdi-account-edit" : "mdi-account-plus" }}
          </v-icon>

          {{ editingId ? "แก้ไขข้อมูลบุคลากร" : "เพิ่มบุคลากร" }}
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
            v-model="form.first_name"
            label="ชื่อ"
            variant="outlined"
            prepend-inner-icon="mdi-account"
          />

          <v-text-field
            v-model="form.last_name"
            label="นามสกุล"
            variant="outlined"
            prepend-inner-icon="mdi-account"
          />

          <v-text-field
            v-model="form.email"
            label="อีเมล"
            variant="outlined"
            prepend-inner-icon="mdi-email"
          />

          <v-text-field
            v-model="form.position"
            label="ตำแหน่ง"
            variant="outlined"
            prepend-inner-icon="mdi-briefcase"
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
            @click="saveEmployee"
          >
            บันทึกข้อมูล
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>
