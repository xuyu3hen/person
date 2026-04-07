import { spawn } from "node:child_process";

const port = process.env.PORT ?? "4173";
const args = ["serve", "out", "-l", port];

const child = spawn(process.platform === "win32" ? "npx.cmd" : "npx", args, {
  stdio: "inherit",
  shell: false,
  env: process.env,
});

child.on("exit", (code) => {
  process.exit(code ?? 1);
});

