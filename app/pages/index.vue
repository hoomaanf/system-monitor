<template>
  <div class="monitor-container" :class="{ 'language-en': !isPersian }">
    <div class="header">
      <div class="title-section">
        <h1 class="title">
          <Monitor class="title-icon" />
          <span v-if="isPersian">مانیتور سیستم</span>
          <span v-else>System Monitor</span>
        </h1>
        <div class="timestamp">
          <Clock class="timestamp-icon" />
          <span v-if="isPersian">آخرین بروزرسانی:</span>
          <span v-else>Last Update:</span>
          {{ formatTime(data?.systemTime) }}
        </div>
      </div>

      <div class="controls">
        <button
          class="refresh-btn"
          @click="refreshData"
          :disabled="pending"
          v-if="!autoRefresh"
        >
          <RefreshCw class="refresh-icon" :class="{ refreshing: pending }" />
          <span v-if="isPersian">{{
            pending ? "در حال بروزرسانی..." : "بروزرسانی"
          }}</span>
          <span v-else>{{ pending ? "Refreshing..." : "Refresh" }}</span>
        </button>

        <button class="lang-btn" @click="toggleLanguage">
          <Languages class="lang-icon" />
          {{ isPersian ? "EN" : "فارسی" }}
        </button>
      </div>
    </div>

    <div class="dashboard">
      <!-- CPU Section -->
      <div class="card cpu-card">
        <div class="card-header">
          <div class="card-title">
            <Cpu class="card-icon" />
            <span v-if="isPersian">پردازنده (CPU)</span>
            <span v-else>Processor (CPU)</span>
          </div>
          <div class="card-value">
            <Zap class="value-icon" />
            {{ data?.cpu?.usage ?? 0 }}%
          </div>
        </div>
        <div class="progress-container">
          <div
            class="progress-bar"
            :style="{ width: `${data?.cpu?.usage ?? 0}%` }"
          ></div>
        </div>
        <div class="card-footer">
          <div class="usage-level">
            <component :is="getUsageIcon('cpu')" class="status-icon" />
            <span v-if="data?.cpu?.usage < 30" class="low">
              {{ isPersian ? "کم" : "Low" }}
            </span>
            <span v-else-if="data?.cpu?.usage < 70" class="medium">
              {{ isPersian ? "متوسط" : "Medium" }}
            </span>
            <span v-else class="high">
              {{ isPersian ? "زیاد" : "High" }}
            </span>
          </div>
        </div>
      </div>

      <!-- RAM Section -->
      <div class="card ram-card">
        <div class="card-header">
          <div class="card-title">
            <MemoryStick class="card-icon" />
            <span v-if="isPersian">حافظه رم (RAM)</span>
            <span v-else>Memory (RAM)</span>
          </div>
          <div class="card-value">
            <TrendingUp class="value-icon" />
            {{ data?.ram?.percent ?? 0 }}%
          </div>
        </div>
        <div class="progress-container">
          <div
            class="progress-bar"
            :style="{ width: `${data?.ram?.percent ?? 0}%` }"
          ></div>
        </div>
        <div class="card-details">
          <div class="detail-item">
            <span v-if="isPersian">استفاده شده:</span>
            <span v-else>Used:</span>
            <strong>{{ data?.ram?.used ?? 0 }} {{ data?.ram?.unit }}</strong>
          </div>
          <div class="detail-item">
            <span v-if="isPersian">کل حافظه:</span>
            <span v-else>Total:</span>
            <strong>{{ data?.ram?.total ?? 0 }} {{ data?.ram?.unit }}</strong>
          </div>
        </div>
      </div>

      <!-- Swap Section -->
      <div class="card swap-card">
        <div class="card-header">
          <div class="card-title">
            <HardDriveDownload class="card-icon" />
            <span v-if="isPersian">حافظه تعویض (Swap)</span>
            <span v-else>Swap Memory</span>
          </div>
          <div class="card-value">
            <Settings class="value-icon" />
            {{ data?.swap?.percent ?? 0 }}%
          </div>
        </div>
        <div class="progress-container">
          <div
            class="progress-bar"
            :style="{ width: `${data?.swap?.percent ?? 0}%` }"
          ></div>
        </div>
        <div class="card-details">
          <div class="detail-item">
            <span v-if="isPersian">استفاده شده:</span>
            <span v-else>Used:</span>
            <strong>{{ data?.swap?.used ?? 0 }} {{ data?.swap?.unit }}</strong>
          </div>
          <div class="detail-item">
            <span v-if="isPersian">کل حافظه:</span>
            <span v-else>Total:</span>
            <strong>{{ data?.swap?.total ?? 0 }} {{ data?.swap?.unit }}</strong>
          </div>
        </div>
      </div>

      <!-- GPU Section -->
      <div class="card gpu-card">
        <div class="card-header">
          <div class="card-title">
            <Gamepad2 class="card-icon" />
            <span v-if="isPersian">کارت گرافیک (GPU)</span>
            <span v-else>Graphics Card (GPU)</span>
          </div>
          <div class="card-value">
            <Gauge class="value-icon" />
            {{ data?.gpu?.usage ?? 0 }}%
          </div>
        </div>
        <div class="progress-container">
          <div
            class="progress-bar"
            :style="{ width: `${data?.gpu?.usage ?? 0}%` }"
          ></div>
        </div>
        <div class="card-details">
          <div class="detail-item">
            <span v-if="isPersian">سازنده:</span>
            <span v-else>Vendor:</span>
            <strong class="gpu-vendor">{{
              getGPUVendorName(data?.gpu?.vendor)
            }}</strong>
          </div>
          <div class="detail-item">
            <span v-if="isPersian">وضعیت:</span>
            <span v-else>Status:</span>
            <strong
              :class="{
                'status-idle': !data?.gpu?.usage || data.gpu.usage < 10,
                'status-active': data?.gpu?.usage >= 10,
              }"
            >
              {{ getGPUStatus(data?.gpu?.usage) }}
            </strong>
          </div>
        </div>
      </div>

      <!-- System Summary -->
      <div class="card summary-card">
        <div class="card-header">
          <div class="card-title">
            <PieChart class="card-icon" />
            <span v-if="isPersian">خلاصه وضعیت سیستم</span>
            <span v-else>System Summary</span>
          </div>
        </div>
        <div class="summary-content">
          <div class="summary-item" :class="getStatusClass('cpu')">
            <span class="summary-label">
              <Cpu class="summary-icon" />
              <span v-if="isPersian">پردازنده:</span>
              <span v-else>CPU:</span>
            </span>
            <span class="summary-value">
              <component :is="getStatusIcon('cpu')" class="status-indicator" />
              {{ getStatusText("cpu") }}
            </span>
          </div>
          <div class="summary-item" :class="getStatusClass('ram')">
            <span class="summary-label">
              <MemoryStick class="summary-icon" />
              <span v-if="isPersian">حافظه رم:</span>
              <span v-else>RAM:</span>
            </span>
            <span class="summary-value">
              <component :is="getStatusIcon('ram')" class="status-indicator" />
              {{ getStatusText("ram") }}
            </span>
          </div>
          <div class="summary-item" :class="getStatusClass('swap')">
            <span class="summary-label">
              <HardDriveDownload class="summary-icon" />
              <span v-if="isPersian">حافظه تعویض:</span>
              <span v-else>Swap:</span>
            </span>
            <span class="summary-value">
              <component :is="getStatusIcon('swap')" class="status-indicator" />
              {{ getStatusText("swap") }}
            </span>
          </div>
          <div class="summary-item" :class="getStatusClass('gpu')">
            <span class="summary-label">
              <Gamepad2 class="summary-icon" />
              <span v-if="isPersian">کارت گرافیک:</span>
              <span v-else>GPU:</span>
            </span>
            <span class="summary-value">
              <component :is="getStatusIcon('gpu')" class="status-indicator" />
              {{ getStatusText("gpu") }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Auto Refresh Toggle -->
    <div class="auto-refresh">
      <label class="auto-refresh-toggle">
        <input type="checkbox" v-model="autoRefresh" />
        <span class="toggle-slider"></span>
        <span class="toggle-text">
          <Repeat class="toggle-icon" />
          <span v-if="isPersian">بروزرسانی خودکار (هر 1 ثانیه)</span>
          <span v-else>Auto Refresh (Every 1s)</span>
        </span>
      </label>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from "vue";

import {
  Monitor,
  Clock,
  RefreshCw,
  Languages,
  Cpu,
  Zap,
  MemoryStick,
  TrendingUp,
  HardDriveDownload,
  Settings,
  Gamepad2,
  Gauge,
  PieChart,
  Repeat,
  CheckCircle,
  AlertCircle,
  XCircle,
  HelpCircle,
  Bolt,
} from "lucide-vue-next";

const isPersian = ref(true);
const autoRefresh = ref(false);
const refreshInterval = ref(null);
const timeUntilRefresh = ref(1);

const { data, refresh, pending } = await useFetch("/api/system");

const formatTime = (timestamp) => {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  return date.toLocaleTimeString(isPersian.value ? "fa-IR" : "en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

const refreshData = async () => {
  await refresh();
  timeUntilRefresh.value = 1;
};

const toggleLanguage = () => {
  isPersian.value = !isPersian.value;
};

const getGPUVendorName = (vendor) => {
  const vendors = {
    nvidia: isPersian.value ? "انویدیا" : "NVIDIA",
    "intel/amd": isPersian.value ? "اینتل/AMD" : "Intel/AMD",
    unknown: isPersian.value ? "نامشخص" : "Unknown",
    error: isPersian.value ? "خطا" : "Error",
  };
  return vendors[vendor] || vendor;
};

const getGPUStatus = (usage) => {
  if (!usage && usage !== 0) return isPersian.value ? "نامشخص" : "Unknown";
  if (usage < 10) return isPersian.value ? "آماده به کار" : "Idle";
  return isPersian.value ? "فعال" : "Active";
};

const getUsageIcon = (component) => {
  const value = getComponentValue(component);

  if (value < 30) return CheckCircle;
  if (value < 70) return AlertCircle;
  return XCircle;
};

const getGPUStatusIcon = (usage) => {
  if (!usage && usage !== 0) return HelpCircle;
  if (usage < 10) return CheckCircle;
  return Bolt;
};

const getStatusIcon = (component) => {
  const value = getComponentValue(component);

  if (value < 30) return CheckCircle;
  if (value < 70) return AlertCircle;
  return XCircle;
};

const getStatusClass = (component) => {
  const value = getComponentValue(component);

  if (value < 30) return "status-good";
  if (value < 70) return "status-warning";
  return "status-critical";
};

const getStatusText = (component) => {
  const value = getComponentValue(component);
  const texts = {
    good: isPersian.value ? "بهینه" : "Optimal",
    warning: isPersian.value ? "متوسط" : "Moderate",
    critical: isPersian.value ? "پر بار" : "High Load",
  };

  if (value < 30) return texts.good;
  if (value < 70) return texts.warning;
  return texts.critical;
};

const getComponentValue = (component) => {
  if (!data.value) return 0;

  switch (component) {
    case "cpu":
      return data.value.cpu?.usage ?? 0;
    case "ram":
      return data.value.ram?.percent ?? 0;
    case "swap":
      return data.value.swap?.percent ?? 0;
    case "gpu":
      return data.value.gpu?.usage ?? 0;
    default:
      return 0;
  }
};

watch(autoRefresh, (newValue) => {
  if (newValue) {
    refreshInterval.value = setInterval(() => {
      if (timeUntilRefresh.value <= 1) {
        refreshData();
      } else {
        timeUntilRefresh.value--;
      }
    }, 1000);
  } else {
    if (refreshInterval.value) {
      clearInterval(refreshInterval.value);
      refreshInterval.value = null;
    }
    timeUntilRefresh.value = 1;
  }
});

onMounted(() => {
  document.body.style.fontFamily =
    "'Vazir', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
  document.documentElement.dir = isPersian.value ? "rtl" : "ltr";
});

watch(isPersian, (newValue) => {
  document.documentElement.dir = newValue ? "rtl" : "ltr";
});

onUnmounted(() => {
  if (refreshInterval.value) {
    clearInterval(refreshInterval.value);
  }
});
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: "Vazir", "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  color: #e2e8f0;
  min-height: 100vh;
  padding: 20px;
  line-height: 1.6;
}

.monitor-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

/* Header */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 2px solid #334155;
}

.title-section .title {
  font-size: 2.5rem;
  background: linear-gradient(90deg, #60a5fa 0%, #818cf8 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 5px;
  display: flex;
  align-items: center;
  gap: 15px;
}

.title-icon {
  width: 36px;
  height: 36px;
  stroke: #60a5fa;
}

.timestamp {
  color: #94a3b8;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 8px;
}

.timestamp-icon {
  width: 16px;
  height: 16px;
  stroke: #94a3b8;
}

.controls {
  display: flex;
  gap: 10px;
}

.refresh-btn,
.lang-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-family: "Vazir", sans-serif;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}

.refresh-btn {
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: white;
}

.refresh-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(59, 130, 246, 0.4);
}

.refresh-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.lang-btn {
  background: #334155;
  color: #e2e8f0;
  border: 1px solid #475569;
}

.lang-btn:hover {
  background: #475569;
}

.refresh-icon,
.lang-icon {
  width: 18px;
  height: 18px;
  transition: transform 0.3s ease;
}

.refreshing {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* Dashboard */
.dashboard {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

/* Cards */
.card {
  background: rgba(30, 41, 59, 0.8);
  backdrop-filter: blur(10px);
  border-radius: 15px;
  padding: 20px;
  border: 1px solid #475569;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 1.2rem;
  color: #e2e8f0;
}

.card-icon {
  width: 28px;
  height: 28px;
  flex-shrink: 0;
}

.card-value {
  font-size: 2rem;
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 8px;
}

.value-icon {
  width: 24px;
  height: 24px;
}

/* CPU Card */
.cpu-card .card-value {
  color: #60a5fa;
}

.cpu-card .progress-bar {
  background: linear-gradient(90deg, #60a5fa 0%, #3b82f6 100%);
}

.cpu-card .card-icon {
  stroke: #60a5fa;
}

/* RAM Card */
.ram-card .card-value {
  color: #34d399;
}

.ram-card .progress-bar {
  background: linear-gradient(90deg, #34d399 0%, #10b981 100%);
}

.ram-card .card-icon {
  stroke: #34d399;
}

/* Swap Card */
.swap-card .card-value {
  color: #fbbf24;
}

.swap-card .progress-bar {
  background: linear-gradient(90deg, #fbbf24 0%, #f59e0b 100%);
}

.swap-card .card-icon {
  stroke: #fbbf24;
}

/* GPU Card */
.gpu-card .card-value {
  color: #a78bfa;
}

.gpu-card .progress-bar {
  background: linear-gradient(90deg, #a78bfa 0%, #8b5cf6 100%);
}

.gpu-card .card-icon {
  stroke: #a78bfa;
}

/* Progress Bar */
.progress-container {
  width: 100%;
  height: 8px;
  background: #334155;
  border-radius: 4px;
  overflow: hidden;
  margin: 15px 0;
}

.progress-bar {
  height: 100%;
  border-radius: 4px;
  transition: width 0.5s ease-in-out;
}

/* Usage Levels */
.low {
  color: #34d399;
}
.medium {
  color: #fbbf24;
}
.high {
  color: #f87171;
}

/* Card Details */
.card-details {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 15px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #94a3b8;
  font-size: 0.95rem;
  padding: 8px 0;
  border-bottom: 1px solid #334155;
}

.detail-item:last-child {
  border-bottom: none;
}

.detail-icon {
  width: 18px;
  height: 18px;
  stroke: #94a3b8;
  flex-shrink: 0;
}

.detail-item strong {
  color: #e2e8f0;
}

.gpu-vendor {
  color: #a78bfa;
}

.status-idle {
  color: #34d399;
}
.status-active {
  color: #fbbf24;
}

/* Card Footer */
.card-footer {
  margin-top: 15px;
  padding-top: 10px;
  border-top: 1px solid #334155;
}

.usage-level {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
}

.status-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

/* آیکون‌های وضعیت */
.status-icon.check-circle {
  stroke: #34d399;
}
.status-icon.alert-circle {
  stroke: #fbbf24;
}
.status-icon.x-circle {
  stroke: #f87171;
}
.status-icon.help-circle {
  stroke: #94a3b8;
}
.status-icon.bolt {
  stroke: #fbbf24;
}

/* Summary Card */
.summary-card {
  grid-column: 1 / -1;
}

.summary-content {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 15px;
  margin-top: 15px;
}

.summary-item {
  padding: 15px;
  border-radius: 10px;
  background: #1e293b;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.3s ease;
}

.summary-item:hover {
  transform: translateY(-3px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
}

.status-good {
  background: rgba(52, 211, 153, 0.1);
  border-left: 4px solid #34d399;
}

.status-warning {
  background: rgba(251, 191, 36, 0.1);
  border-left: 4px solid #fbbf24;
}

.status-critical {
  background: rgba(248, 113, 113, 0.1);
  border-left: 4px solid #f87171;
}

.summary-label {
  color: #94a3b8;
  display: flex;
  align-items: center;
  gap: 10px;
}

.summary-icon {
  width: 20px;
  height: 20px;
  stroke: #94a3b8;
  flex-shrink: 0;
}

.summary-value {
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-indicator {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.status-good .summary-value {
  color: #34d399;
}
.status-warning .summary-value {
  color: #fbbf24;
}
.status-critical .summary-value {
  color: #f87171;
}

/* Status indicator colors */
.status-indicator.check-circle {
  stroke: #34d399;
}
.status-indicator.alert-circle {
  stroke: #fbbf24;
}
.status-indicator.x-circle {
  stroke: #f87171;
}

/* Auto Refresh */
.auto-refresh {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  margin-top: 30px;
  padding: 20px;
  background: rgba(30, 41, 59, 0.8);
  border-radius: 12px;
  border: 1px solid #475569;
}

.auto-refresh-toggle {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  user-select: none;
}

.auto-refresh-toggle input {
  display: none;
}

.toggle-slider {
  width: 50px;
  height: 26px;
  background: #475569;
  border-radius: 13px;
  position: relative;
  transition: background 0.3s;
}

.toggle-slider:before {
  content: "";
  position: absolute;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: white;
  top: 3px;
  left: 3px;
  transition: transform 0.3s;
}

input:checked + .toggle-slider {
  background: #3b82f6;
}

input:checked + .toggle-slider:before {
  transform: translateX(24px);
}

.toggle-text {
  color: #e2e8f0;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1rem;
}

.toggle-icon {
  width: 18px;
  height: 18px;
  stroke: #e2e8f0;
}

.refresh-interval {
  background: #3b82f6;
  color: white;
  width: 45px;
  height: 45px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  gap: 5px;
}

.interval-icon {
  width: 18px;
  height: 18px;
  stroke: white;
}

/* RTL Support */
[dir="rtl"] .card-title,
[dir="rtl"] .detail-item,
[dir="rtl"] .summary-label,
[dir="rtl"] .summary-value {
  flex-direction: row;
}

[dir="rtl"] .card-footer {
  text-align: right;
}

[dir="rtl"] .summary-item {
  border-left: none;
  border-right: 4px solid;
}

.status-good[dir="rtl"] {
  border-right-color: #34d399;
}
.status-warning[dir="rtl"] {
  border-right-color: #fbbf24;
}
.status-critical[dir="rtl"] {
  border-right-color: #f87171;
}

[dir="rtl"] .toggle-slider:before {
  left: auto;
  right: 3px;
}

[dir="rtl"] input:checked + .toggle-slider:before {
  transform: translateX(-24px);
}

/* Responsive */
@media (max-width: 768px) {
  .header {
    flex-direction: column;
    gap: 15px;
    text-align: center;
  }

  .dashboard {
    grid-template-columns: 1fr;
  }

  .title-section .title {
    font-size: 2rem;
    justify-content: center;
  }

  .summary-content {
    grid-template-columns: 1fr;
  }

  .auto-refresh {
    flex-direction: column;
    gap: 15px;
    text-align: center;
  }

  .card-value {
    font-size: 1.8rem;
  }

  .card-title {
    font-size: 1.1rem;
  }

  .card-icon {
    width: 24px;
    height: 24px;
  }

  .value-icon {
    width: 20px;
    height: 20px;
  }
}

/* Loading Animation */
@keyframes shimmer {
  0% {
    background-position: -200px 0;
  }
  100% {
    background-position: 200px 0;
  }
}

.loading {
  background: linear-gradient(90deg, #334155 25%, #475569 50%, #334155 75%);
  background-size: 200px 100%;
  animation: shimmer 1.5s infinite;
}

/* Card specific icon colors */
.summary-card .card-icon {
  stroke: #818cf8;
}
</style>