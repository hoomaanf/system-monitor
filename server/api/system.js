import { exec } from "child_process";
import fs from "fs";
import { promisify } from "util";

const execAsync = promisify(exec);

let cpuStats = {
  last: null,
  lastTime: null,
  lastUsage: 0,
};

// ---------------- CPU ----------------
function parseCPUStat(stat) {
  const parts = stat.split(/\s+/).slice(1).map(Number);
  const total = parts.reduce((a, b) => a + b, 0);
  const idle = parts[3];
  const iowait = parts[4]; // برای دقت بیشتر
  return { total, idle, iowait };
}

async function getCPUUsage() {
  try {
    const { stdout: stat } = await execAsync("grep 'cpu ' /proc/stat");
    const current = parseCPUStat(stat);
    const now = Date.now();

    // اگر اولین بار است یا قبلاً ذخیره نشده
    if (!cpuStats.last || !cpuStats.lastTime) {
      cpuStats.last = current;
      cpuStats.lastTime = now;
      cpuStats.lastUsage = 0;
      return 0; // اولین بار همیشه صفر است
    }

    // فاصله زمانی
    const timeDiff = now - cpuStats.lastTime;

    // حداقل 1 ثانیه صبر کن
    if (timeDiff < 1000) {
      // اگر زمان کم است، آخرین مقدار ذخیره شده را برگردان
      return cpuStats.lastUsage;
    }

    const totalDiff = current.total - cpuStats.last.total;
    const idleDiff = current.idle - cpuStats.last.idle;

    // محافظت در برابر مقادیر غیرمعمول
    if (totalDiff <= 0 || idleDiff < 0) {
      cpuStats.last = current;
      cpuStats.lastTime = now;
      return cpuStats.lastUsage;
    }

    // محاسبه استفاده CPU
    const usagePercent = ((totalDiff - idleDiff) / totalDiff) * 100;

    // محدود کردن و گرد کردن
    let usage = Math.round(usagePercent);
    usage = Math.min(Math.max(usage, 0), 100);

    // ذخیره برای بار بعد
    cpuStats.last = current;
    cpuStats.lastTime = now;
    cpuStats.lastUsage = usage;

    return usage;
  } catch (error) {
    console.error("Error getting CPU usage:", error);
    return cpuStats.lastUsage || 0;
  }
}

// تابع کمکی برای ردیابی مقدار CPU در پس‌زمینه
// این تضمین می‌کند که همیشه آخرین مقدار آماده باشد
let cpuMonitorInterval = null;

function startCPUMonitor() {
  if (cpuMonitorInterval) return;

  // هر 2 ثانیه CPU را چک کن
  cpuMonitorInterval = setInterval(async () => {
    try {
      await getCPUUsage(); // فقط برای بروزرسانی مقدار
    } catch (e) {
      // خطا را نادیده بگیر
    }
  }, 2000);

  // همچنین یک بار در ابتدا اجرا کن
  getCPUUsage();
}

// ---------------- RAM ----------------
function parseMem(memRaw) {
  try {
    const lines = memRaw.split("\n");
    if (lines.length < 2) {
      throw new Error("Invalid memory data");
    }

    // خط دوم (Mem:) شامل اطلاعات اصلی است
    const memLine = lines[1];
    const parts = memLine.split(/\s+/).map(Number);

    if (parts.length < 3) {
      throw new Error("Invalid memory data format");
    }

    const total = parts[1];
    const used = parts[2];
    const available = parts[6]; // ستون available در خروجی جدید free

    // استفاده از فرمول دقیق‌تر
    const actualUsed = total - available;
    const percent = Math.round((actualUsed / total) * 100);

    return {
      used: +(actualUsed / 1024 ** 3).toFixed(1),
      total: Math.round(total / 1024 ** 3),
      percent: percent,
      unit: "GB",
    };
  } catch (error) {
    console.error("Error parsing memory:", error);
    return {
      used: 0,
      total: 0,
      percent: 0,
      unit: "GB",
    };
  }
}

// ---------------- Swap ----------------
function parseSwap(swapRaw) {
  try {
    if (!swapRaw || swapRaw.trim() === "") {
      return {
        used: 0,
        total: 0,
        percent: 0,
        unit: "GB",
      };
    }

    const lines = swapRaw.split("\n");
    let total = 0,
      free = 0;

    for (const line of lines) {
      if (line.startsWith("SwapTotal:")) {
        total = Number(line.split(/\s+/)[1]);
      } else if (line.startsWith("SwapFree:")) {
        free = Number(line.split(/\s+/)[1]);
      }
    }

    if (total === 0) {
      return {
        used: 0,
        total: 0,
        percent: 0,
        unit: "GB",
      };
    }

    const used = total - free;
    const usedGB = used / (1024 * 1024);
    const totalGB = total / (1024 * 1024);

    return {
      used: +usedGB.toFixed(2),
      total: Math.round(totalGB),
      percent: Math.round((used / total) * 100),
      unit: "GB",
    };
  } catch (error) {
    console.error("Error parsing swap:", error);
    return {
      used: 0,
      total: 0,
      percent: 0,
      unit: "GB",
    };
  }
}

// ---------------- GPU ----------------
async function getGPUUsage() {
  try {
    // NVIDIA GPU
    try {
      const { stdout: nvidiaOutput } = await execAsync(
        "timeout 2 nvidia-smi --query-gpu=utilization.gpu --format=csv,noheader,nounits 2>/dev/null"
      );
      const nvidia = nvidiaOutput.trim();
      if (nvidia && !isNaN(Number(nvidia))) {
        const usage = Number(nvidia);
        return {
          vendor: "nvidia",
          usage: usage >= 0 && usage <= 100 ? usage : 0,
          unit: "%",
        };
      }
    } catch (nvidiaError) {
      // ادامه به سراغ راه‌حل‌های دیگر
    }

    // Intel/AMD GPU از طریق فایل‌های sys
    const gpuPaths = [
      "/sys/class/drm/card0/device/gpu_busy_percent",
      "/sys/class/drm/card1/device/gpu_busy_percent",
      "/sys/class/drm/card2/device/gpu_busy_percent",
      "/sys/class/hwmon/hwmon*/device/gpu_busy_percent", // برای بعضی سیستم‌ها
    ];

    for (const pathPattern of gpuPaths) {
      try {
        // بررسی اگر pathPattern حاوی wildcard باشد
        if (pathPattern.includes("*")) {
          const { stdout: findResult } = await execAsync(
            `find ${pathPattern.replace("*", "0")} 2>/dev/null | head -1`
          );
          const foundPath = findResult.trim();
          if (foundPath && fs.existsSync(foundPath)) {
            const busy = fs.readFileSync(foundPath, "utf8").trim();
            const usage = Number(busy);
            if (!isNaN(usage) && usage >= 0 && usage <= 100) {
              return {
                vendor: "intel/amd",
                usage: usage,
                unit: "%",
              };
            }
          }
        } else if (fs.existsSync(pathPattern)) {
          const busy = fs.readFileSync(pathPattern, "utf8").trim();
          const usage = Number(busy);
          if (!isNaN(usage) && usage >= 0 && usage <= 100) {
            return {
              vendor: "intel/amd",
              usage: usage,
              unit: "%",
            };
          }
        }
      } catch (fileError) {
        continue;
      }
    }

    return { vendor: "unknown", usage: null, unit: "%" };
  } catch (error) {
    console.error("Error getting GPU usage:", error);
    return { vendor: "error", usage: null, unit: "%" };
  }
}

// ---------------- API ----------------
export default defineEventHandler(async () => {
  try {
    // مانیتور CPU را شروع کن (اگر قبلاً شروع نشده)
    if (!cpuMonitorInterval) {
      startCPUMonitor();
    }

    // همه درخواست‌ها را به صورت موازی اجرا کن
    const [memResult, swapResult, cpuResult, gpuResult] =
      await Promise.allSettled([
        execAsync("free -b")
          .then((res) => res.stdout)
          .catch(() => ""),
        execAsync("grep -E 'Swap(Total|Free):' /proc/meminfo")
          .then((res) => res.stdout)
          .catch(() => ""),
        getCPUUsage(),
        getGPUUsage(),
      ]);

    const memRaw = memResult.status === "fulfilled" ? memResult.value : "";
    const swapRaw = swapResult.status === "fulfilled" ? swapResult.value : "";
    const cpuUsage = cpuResult.status === "fulfilled" ? cpuResult.value : 0;
    const gpuInfo =
      gpuResult.status === "fulfilled"
        ? gpuResult.value
        : { vendor: "unknown", usage: null, unit: "%" };

    const ramInfo = parseMem(memRaw);
    const swapInfo = parseSwap(swapRaw);

    return {
      cpu: {
        usage: cpuUsage,
        unit: "%",
        timestamp: new Date().toISOString(),
      },
      ram: ramInfo,
      swap: swapInfo,
      gpu: gpuInfo,
      systemTime: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error in API handler:", error);
    return {
      error: "Failed to fetch system metrics",
      cpu: { usage: cpuStats.lastUsage || 0, unit: "%" },
      ram: { used: 0, total: 0, percent: 0, unit: "GB" },
      swap: { used: 0, total: 0, percent: 0, unit: "GB" },
      gpu: { vendor: "error", usage: null, unit: "%" },
      systemTime: new Date().toISOString(),
    };
  }
});
