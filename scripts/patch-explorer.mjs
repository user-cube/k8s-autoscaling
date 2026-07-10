import { readFileSync, writeFileSync } from "fs"
import { readdirSync } from "fs"
import { join } from "path"

// The explorer plugin generates one script per page-type instance.
// All copies register the same nav/render listeners, causing double-toggle.
// Fix: keep the first copy intact, remove nav/render listeners from duplicates.

const SCRIPTS_DIR = "public/static/scripts"
const MARKER = 'mobile-explorer'
const LISTENER = 'document.addEventListener("nav",L);document.addEventListener("render",L);'

const files = readdirSync(SCRIPTS_DIR)
  .filter(f => f.startsWith("script-") && f.endsWith(".js"))
  .map(f => join(SCRIPTS_DIR, f))
  .filter(f => {
    const content = readFileSync(f, "utf-8")
    return content.includes(MARKER)
  })

if (files.length <= 1) {
  console.log(`Found ${files.length} explorer script(s) — no dedup needed`)
  process.exit(0)
}

console.log(`Found ${files.length} explorer script(s): ${files.map(f => f.split("/").pop()).join(", ")}`)

// Keep the first intact, neutralize nav/render listeners in the rest
for (const file of files.slice(1)) {
  const content = readFileSync(file, "utf-8")
  if (!content.includes(LISTENER)) {
    console.log(`Already patched: ${file.split("/").pop()}`)
    continue
  }
  const updated = content.replace(LISTENER, "/* explorer nav listener removed — deduped by patch-explorer */")
  writeFileSync(file, updated)
  console.log(`Deduped: ${file.split("/").pop()}`)
}

console.log("Done")
