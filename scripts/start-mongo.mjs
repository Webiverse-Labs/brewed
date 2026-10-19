import { spawn } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const local = join(root, ".local");
const bundled = join(local, "mongodb", "bin", process.platform === "win32" ? "mongod.exe" : "mongod");
const data = join(local, "mongodb-data");
mkdirSync(data, { recursive: true });

// Use the project-local installation when available, otherwise use MongoDB from PATH.
const child = spawn(existsSync(bundled) ? bundled : "mongod", [
  "--bind_ip", "127.0.0.1",
  "--port", "27017",
  "--dbpath", data,
  "--logpath", join(local, "mongodb.log"),
  "--logappend",
], { stdio: "inherit", windowsHide: true });

child.on("spawn", () => console.log(`MongoDB: mongodb://127.0.0.1:27017 (data: ${data})`));
child.on("error", (error) => {
  console.error(error.code === "ENOENT"
    ? "MongoDB is missing. Install mongod on PATH or extract it to .local/mongodb/bin (see README.md)."
    : error.message);
  process.exitCode = 1;
});
child.on("exit", (code) => { process.exitCode = code ?? 1; });
