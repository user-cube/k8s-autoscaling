import { readFileSync, writeFileSync } from "fs"

const FILES = [
  ".quartz/plugins/footer/dist/components/index.js",
  ".quartz/plugins/footer/dist/index.js",
]

// Replace the entire Footer_default factory with our custom version.
// This avoids fragile regex on nested JSX structures.
const START = "var Footer_default = ((opts) => {"
const END = "export { Footer_default as Footer };"

const REPLACEMENT = `var Footer_default = ((opts) => {
  const Footer = ({ displayClass, cfg }) => {
    const year = (/* @__PURE__ */ new Date()).getFullYear();
    const links = opts?.links ?? [];
    return /* @__PURE__ */ u2("footer", { class: \`\${displayClass ?? ""}\`, children: [
      /* @__PURE__ */ u2("p", { children: [
        "\\xA9 ", year, " \\xB7 ",
        /* @__PURE__ */ u2("a", { href: "https://ruicoelho.dev", children: "Rui Coelho" })
      ] }),
      /* @__PURE__ */ u2("ul", { children: Object.entries(links).map(([text, link]) => /* @__PURE__ */ u2("li", { children: /* @__PURE__ */ u2("a", { href: link, children: text }) })) })
    ] });
  };
  Footer.css = footer_default;
  return Footer;
});

export { Footer_default as Footer };`

let patched = 0
for (const file of FILES) {
  const content = readFileSync(file, "utf-8")
  if (content.includes("ruicoelho.dev")) {
    console.log(`Already patched: ${file}`)
    continue
  }
  const startIdx = content.indexOf(START)
  const endIdx = content.indexOf(END)
  if (startIdx === -1 || endIdx === -1) {
    console.error(`Markers not found in: ${file}`)
    process.exit(1)
  }
  const updated = content.substring(0, startIdx) + REPLACEMENT + content.substring(endIdx + END.length)
  writeFileSync(file, updated)
  console.log(`Patched: ${file}`)
  patched++
}
console.log(`Done — ${patched} file(s) patched`)
