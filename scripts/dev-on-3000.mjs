import { spawnSync } from "node:child_process";

const port = 3000;

function runPowerShell(command) {
  return spawnSync(
    "powershell",
    [
      "-NoProfile",
      "-ExecutionPolicy",
      "Bypass",
      "-Command",
      command,
    ],
    {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }
  );
}

function getListeningPids(targetPort) {
  const result = runPowerShell(
    `Get-NetTCPConnection -LocalPort ${targetPort} -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique`
  );

  if (result.error) {
    throw result.error;
  }

  const stdout = result.stdout.trim();
  if (!stdout) return [];

  return stdout
    .split(/\r?\n/)
    .map((line) => Number(line.trim()))
    .filter((pid) => Number.isInteger(pid) && pid > 0);
}

function killProcesses(pids) {
  for (const pid of pids) {
    const result = runPowerShell(
      `Stop-Process -Id ${pid} -Force -ErrorAction SilentlyContinue`
    );
    if (result.status !== 0 && result.stderr.trim()) {
      throw new Error(result.stderr.trim());
    }
    console.log(`[dev:3000] 已清理占用进程 PID=${pid}`);
  }
}

function ensurePortAvailable(targetPort) {
  const pids = getListeningPids(targetPort);
  if (!pids.length) {
    console.log(`[dev:3000] 端口 ${targetPort} 空闲`);
    return;
  }

  console.log(
    `[dev:3000] 端口 ${targetPort} 被占用，准备清理进程: ${pids.join(", ")}`
  );
  killProcesses(pids);
}

function startNextDev(targetPort) {
  const nextBin = ".\\node_modules\\next\\dist\\bin\\next";
  const result = spawnSync(
    process.execPath,
    [nextBin, "dev", "-p", String(targetPort)],
    {
      stdio: "inherit",
      shell: false,
    }
  );

  if (result.error) {
    throw result.error;
  }

  process.exit(result.status ?? 0);
}

try {
  ensurePortAvailable(port);
  startNextDev(port);
} catch (error) {
  const message =
    error instanceof Error ? error.message : "Unknown startup error";
  console.error(`[dev:3000] 启动失败: ${message}`);
  process.exit(1);
}
