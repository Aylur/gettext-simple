import * as fs from "node:fs/promises"
import * as path from "node:path"
import * as process from "node:process"
import po2json from "../lib/po2json"

const [, script, input, output] = process.argv

if (import.meta.url === `file://${path.resolve(script)}`) {
  if (input) {
    const content = await fs.readFile(path.resolve(input), "utf-8")
    const result = JSON.stringify(po2json(content))

    if (output) {
      fs.writeFile(path.resolve(output), result)
    } else {
      process.stdout.write(result)
    }
  }
}
