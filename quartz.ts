import { loadQuartzConfig, loadQuartzLayout } from "./quartz/plugins/loader/config-loader"
import * as ExternalPlugin from "./.quartz/plugins"

const config = await loadQuartzConfig()
export default config
export const layout = await loadQuartzLayout()

ExternalPlugin.Explorer({
  folderDefaultState: "open",
  folderClickBehavior: "link",
  useSavedState: true,
  sortFn: (a, b) => {
    const nameA = a.displayName ?? ""
    const nameB = b.displayName ?? ""
    return nameA.localeCompare(nameB, undefined, { numeric: true, sensitivity: "base" })
  },
})
