import { parseToAst, type AstNode } from "../ast"
import { Gettext as BaseGettext } from "../gettext.js"
import { type JSX, type ReactNode, Fragment } from "react"
import * as fmt from "../format.js"

function render(
  nodes: AstNode[],
  fns: Record<string, (s: ReactNode) => ReactNode>,
) {
  return (
    <>
      {nodes.map((n, i): string | JSX.Element => {
        if (n.type === "text") {
          return <Fragment key={i}>{n.value}</Fragment>
        } else {
          const content = render(n.children, fns)
          return (
            <Fragment key={i}>{fns[n.name]?.(content) ?? content}</Fragment>
          )
        }
      })}
    </>
  )
}

export class Gettext extends BaseGettext<ReactNode> {
  protected override readonly fmtRich: fmt.FmtRich<ReactNode> = (
    msgid,
    record,
  ) => {
    const { tags, values } = fmt.get<ReactNode>(record)
    const text = fmt.fstring(this._gettext(msgid), values)
    return render(parseToAst(text), tags)
  }

  protected override readonly nfmtRich: fmt.NFmtRich<ReactNode> = (
    msgid1,
    msgid2,
    n,
    record,
  ) => {
    const { tags, values } = fmt.get<ReactNode>(record)
    const text = fmt.fstring(this._ngettext(msgid1, msgid2, n), values)
    return render(parseToAst(text), tags)
  }

  protected override readonly pfmtRich: fmt.PFmtRich<ReactNode> = (
    msgctxt,
    msgid,
    record,
  ) => {
    const { tags, values } = fmt.get<ReactNode>(record)
    const text = fmt.fstring(this._pgettext(msgctxt, msgid), values)
    return render(parseToAst(text), tags)
  }
}
