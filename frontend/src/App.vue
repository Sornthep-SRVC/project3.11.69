
<script setup>
import { ref } from "vue";
import Employees from "./components/Employees.vue";
import EvaluationTopics from "./components/EvaluationTopics.vue";
import EvaluationPeriods from "./components/EvaluationPeriods.vue";
import EvaluationAssignments from "./components/EvaluationAssignments.vue";
import EvaluationScoring from "./components/EvaluationScoring.vue";

const currentPage = ref("dashboard");
const isLoggedIn = ref(false);
const username = ref("");
const password = ref("");
const errorMessage = ref("");
const loading = ref(false);
const currentUser = ref(null);

const menuItems = [
  { title: "Dashboard", icon: "mdi-view-dashboard", value: "dashboard" },
  { title: "บุคลากร", icon: "mdi-account-group", value: "employees" },
  { title: "หัวข้อการประเมิน", icon: "mdi-clipboard-list", value: "topics" },
  { title: "ตัวชี้วัด", icon: "mdi-format-list-checks", value: "indicators" },
  { title: "กำหนดผู้ประเมิน", icon: "mdi-account-check",  value: "assignments"},
  { title: "การประเมิน", icon: "mdi-clipboard-check", value: "evaluations" },
  { title: "รายงานผล", icon: "mdi-chart-bar", value: "reports" },
  { title: "รอบการประเมิน", icon: "mdi-calendar-range", value: "periods" }
];

async function login() {
  errorMessage.value = "";
  loading.value = true;

  try {
    const response = await fetch("http://localhost:5000/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: username.value,
        password: password.value,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      errorMessage.value = result.message || "เข้าสู่ระบบไม่สำเร็จ";
      return;
    }

    localStorage.setItem("token", result.data.token);
    currentUser.value = result.data.user;
    isLoggedIn.value = true;
    currentPage.value = "dashboard";
    password.value = "";
  } catch (error) {
    errorMessage.value = "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้";
  } finally {
    loading.value = false;
  }
}

function logout() {
  localStorage.removeItem("token");
  currentUser.value = null;
  isLoggedIn.value = false;
  username.value = "";
  password.value = "";
  currentPage.value = "dashboard";
}
</script>

<template>
  <v-app>
    <!-- Login Page -->
    <v-main v-if="!isLoggedIn" class="bg-grey-lighten-4">
      <v-container class="fill-height" fluid>
        <v-row align="center" justify="center">
          <v-col cols="12" sm="8" md="5" lg="4">
            <v-card rounded="xl" class="pa-8">
              <div class="text-center mb-6">
                <v-icon size="56" color="indigo-darken-4">
                  mdi-account-tie
                </v-icon>
                <h1 class="text-h5 font-weight-bold mt-3">
                  Personnel System
                </h1>
                <p class="text-grey mt-2">
                  ระบบประเมินบุคลากร
                </p>
              </div>

              <v-form @submit.prevent="login">
                <v-text-field
                  v-model="username"
                  label="Username"
                  prepend-inner-icon="mdi-account"
                  variant="outlined"
                  required
                />

                <v-text-field
                  v-model="password"
                  label="Password"
                  prepend-inner-icon="mdi-lock"
                  type="password"
                  variant="outlined"
                  required
                />

                <v-alert
                  v-if="errorMessage"
                  type="error"
                  variant="tonal"
                  class="mb-4"
                >
                  {{ errorMessage }}
                </v-alert>

                <v-btn
                  type="submit"
                  color="indigo-darken-4"
                  block
                  size="large"
                  :loading="loading"
                >
                  เข้าสู่ระบบ
                </v-btn>
              </v-form>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </v-main>

    <!-- Main System -->
    <v-layout v-else>
      <v-navigation-drawer permanent width="250" color="#172554">
        <div class="pa-5 text-white">
          <h2>Personnel System</h2>
          <p class="text-caption">ระบบประเมินบุคลากร</p>
        </div>

        <v-divider color="white" />

        <v-list nav bg-color="transparent">
          <v-list-item
            v-for="item in menuItems"
            :key="item.value"
            :prepend-icon="item.icon"
            :title="item.title"
            :active="currentPage === item.value"
            active-color="white"
            @click="currentPage = item.value"
          />
        </v-list>

        <template #append>
          <div class="pa-4 text-white">
            <v-divider color="white" class="mb-3" />
            <v-list-item
              prepend-icon="mdi-logout"
              title="ออกจากระบบ"
              @click="logout"
            />
          </div>
        </template>
      </v-navigation-drawer>

      <v-main class="bg-grey-lighten-4">
        <!-- Dashboard -->
        <v-container
          v-if="currentPage === 'dashboard'"
          fluid
          class="pa-8"
        >
          <h1 class="text-h4 font-weight-bold">Dashboard</h1>

          <p class="text-grey-darken-1 mt-2">
            ภาพรวมระบบประเมินบุคลากร
          </p>

          <v-chip class="mt-3" color="indigo">
            ผู้ใช้งาน: {{ currentUser?.username }}
          </v-chip>

          <v-row class="mt-5">
            <v-col cols="12" md="4">
              <v-card rounded="lg" class="pa-5">
                <p class="text-grey">บุคลากรทั้งหมด</p>
                <h2 class="text-h3 mt-3">0</h2>
              </v-card>
            </v-col>

            <v-col cols="12" md="4">
              <v-card rounded="lg" class="pa-5">
                <p class="text-grey">การประเมินทั้งหมด</p>
                <h2 class="text-h3 mt-3">0</h2>
              </v-card>
            </v-col>

            <v-col cols="12" md="4">
              <v-card rounded="lg" class="pa-5">
                <p class="text-grey">รอประเมิน</p>
                <h2 class="text-h3 mt-3">0</h2>
              </v-card>
            </v-col>
          </v-row>

          <v-card rounded="lg" class="pa-6 mt-6">
            <h2 class="text-h5">ยินดีต้อนรับเข้าสู่ระบบ</h2>
            <p class="text-grey-darken-1 mt-3">
              ระบบจัดการและประเมินผลบุคลากร
            </p>
          </v-card>
        </v-container>

       <!-- Employees -->
<Employees v-else-if="currentPage === 'employees'" />

<!-- Evaluation Topics -->
<EvaluationTopics
  v-else-if="currentPage === 'topics'"
/>

<!-- Evaluation Periods -->
<EvaluationPeriods
  v-else-if="currentPage === 'periods'"
/>

<!-- Evaluation Assignments -->
<EvaluationAssignments
  v-else-if="currentPage === 'assignments'"
/>

<EvaluationScoring
  v-else-if="currentPage === 'evaluations'"
/>

<!-- Other Pages -->
<v-container v-else fluid class="pa-8">
  <v-card rounded="lg" class="pa-6">
    <h1 class="text-h4 font-weight-bold">
      {{
        menuItems.find(
          (item) => item.value === currentPage
        )?.title
      }}
    </h1>

    <p class="text-grey mt-3">
      หน้านี้จะพัฒนาต่อในขั้นตอนถัดไป
    </p>
  </v-card>
</v-container>
      </v-main>
    </v-layout>
  </v-app>
</template>
