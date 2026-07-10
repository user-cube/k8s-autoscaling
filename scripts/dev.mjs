import { spawn } from "child_process"
import { watch } from "chokidar"
import { readFileSync, writeFileSync } from "fs"
import { readdirSync } from "fs"
import { join } from "path"

const SCRIPTS_DIR = "public/static/scripts"
const MARKER = "mobile-explorer"
const LISTENER = 'document.addEventListener("nav",L);document.addEventListener("render",L);'

const args = process.argv.slice(2)
const quartz = spawn("npx", ["quartz", "build", "--serve", ...args], {
  stdio: "inherit",
  shell: true,
})

quartz.on("error", (err) => {
  console.error("Failed to start quartz:", err)
  process.exit(1)
})

function patchExplorer() {
  let files
  try {
    files = readdirSync(SCRIPTS_DIR)
      .filter((f) => f.startsWith("script-") && f.endsWith(".js"))
      .map((f) => join(SCRIPTS_DIR, f))
      .filter((f) => readFileSync(f, "utf-8").includes(MARKER))
  } catch {
    return
  }

  if (files.length <= 1) return

  for (const file of files.slice(1)) {
    const content = readFileSync(file, "utf-8")
    if (!content.includes(LISTENER)) continue
    writeFileSync(file, content.replace(LISTENER, "/* deduped */"))
    console.log(`[patch-explorer] deduped ${file.split("/").pop()}`)
  }
}

// wait for quartz to emit the scripts dir before watching
setTimeout(() => {
  watch(`${SCRIPTS_DIR}/script-*.js`, { ignoreInitial: false }).on("add", patchExplorer).on("change", patchExplorer)
  console.log("[patch-explorer] watching scripts for changes...")
}, 5000)

process.on("SIGINT", () => {
  quartz.kill()
  process.exit(0)
})
