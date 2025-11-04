import { parseToAst, type AstNode } from "../ast"
import { Gettext as BaseGettext } from "../gettext.js"
import * as fmt from "../format.js"

function render<I extends string>(
  nodes: AstNode[],
  fns: Record<string, (s: I) => I>,
): string {
  let result = ""
  for (const n of nodes) {
    if (n.type === "text") {
      result += n.value
    } else {
      const content = render(n.children, fns)
      result += fns[n.name]?.(content as I) ?? content
    }
  }
  return result
}

// TODO: replace string with Element
export class Gettext extends BaseGettext<string> {
  protected override readonly fmtRich: fmt.FmtRich<string> = (
    msgid,
    record,
  ) => {
    const { tags, values } = fmt.get<string>(record)
    const text = fmt.fstring(this._gettext(msgid), values)
    return render(parseToAst(text), tags)
  }

  protected override readonly nfmtRich: fmt.NFmtRich<string> = (
    msgid1,
    msgid2,
    n,
    record,
  ) => {
    const { tags, values } = fmt.get<string>(record)
    const text = fmt.fstring(this._ngettext(msgid1, msgid2, n), values)
    return render(parseToAst(text), tags)
  }

  protected override readonly pfmtRich: fmt.PFmtRich<string> = (
    msgctxt,
    msgid,
    record,
  ) => {
    const { tags, values } = fmt.get<string>(record)
    const text = fmt.fstring(this._pgettext(msgctxt, msgid), values)
    return render(parseToAst(text), tags)
  }
}
