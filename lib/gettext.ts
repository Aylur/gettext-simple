import type { Messages, PoJson } from "./po2json"
import { parseToAst, type AstNode } from "./ast.js"
import * as fmt from "./format.js"

function renderString<I extends string>(
  nodes: AstNode[],
  fns: Record<string, (s: I) => I>,
): string {
  let result = ""
  for (const n of nodes) {
    if (n.type === "text") {
      result += n.value
    } else {
      const content = renderString(n.children, fns)
      result += fns[n.name]?.(content as I) ?? content
    }
  }
  return result
}

export abstract class Gettext<El> {
  private readonly messages: Messages
  private readonly pluralFunc!: (n: number) => number
  readonly lang: string

  constructor({
    pluralForms = "nplurals=2; plural=(n != 1);",
    lang = "en",
    messages = { "": {} },
  }: Partial<PoJson> = {}) {
    this.lang = lang
    this.messages = messages

    this.pluralFunc = Function(
      "n",
      "let plural, nplurals; " + pluralForms + " return Number(plural);",
    ) as (n: number) => number
  }

  protected _gettext(msgid: string): string {
    if (msgid in this.messages[""]) {
      const msg = this.messages[""][msgid]
      return (Array.isArray(msg) ? msg.at(1) : msg) ?? msgid
    }

    return msgid
  }

  protected _ngettext(msgid1: string, msgid2: string, n: number): string {
    const index = this.pluralFunc(n)
    return this.messages[""][msgid1]?.at(index) ?? (n === 1 ? msgid1 : msgid2)
  }

  protected _pgettext(msgctxt: string, msgid: string): string {
    const msg = this.messages[msgctxt]?.[msgid] ?? msgid
    return (Array.isArray(msg) ? msg.at(0) : msg) ?? msgid
  }

  #fmtFn: fmt.FmtFunction = (msgid, values?) => {
    const text = this._gettext(msgid)
    return values ? fmt.fstring(text, values) : text
  }

  #fmtMarkup: fmt.FmtMarkup = (msgid, record) => {
    const { tags, values } = fmt.get<string>(record)
    const text = fmt.fstring(this._gettext(msgid), values)
    return renderString(parseToAst(text), tags)
  }

  #nfmtFn: fmt.NFmtFuntion = (msgid1, msgid2, n, values?) => {
    const text = this._ngettext(msgid1, msgid2, n)
    return values ? fmt.fstring(text, values) : text
  }

  #nfmtMarkup: fmt.NFmtMarkup = (msgid1, msgid2, n, record) => {
    const { tags, values } = fmt.get<string>(record)
    const text = fmt.fstring(this._ngettext(msgid1, msgid2, n), values)
    return renderString(parseToAst(text), tags)
  }

  #pfmtFn: fmt.PFmtFunction = (msgctxt, msgid, values?) => {
    const text = this._pgettext(msgctxt, msgid)
    return values ? fmt.fstring(text, values) : text
  }

  #pfmtMarkup: fmt.PFmtMarkup = (msgctxt, msgid, record) => {
    const { tags, values } = fmt.get<string>(record)
    const text = fmt.fstring(this._pgettext(msgctxt, msgid), values)
    return renderString(parseToAst(text), tags)
  }

  protected abstract fmtRich: fmt.FmtRich<El>
  protected abstract pfmtRich: fmt.PFmtRich<El>
  protected abstract nfmtRich: fmt.NFmtRich<El>

  gettext: fmt.Fmt<El> = Object.assign(this.#fmtFn, {
    raw: this._gettext.bind(this),
    markup: this.#fmtMarkup,
    rich: (...args: Parameters<fmt.FmtRich<El>>) => this.fmtRich(...args),
  })

  pgettext: fmt.PFmt<El> = Object.assign(this.#pfmtFn, {
    raw: this._pgettext.bind(this),
    markup: this.#pfmtMarkup,
    rich: (...args: Parameters<fmt.PFmtRich<El>>) => this.pfmtRich(...args),
  })

  ngettext: fmt.NFmt<El> = Object.assign(this.#nfmtFn, {
    raw: this._ngettext.bind(this),
    markup: this.#nfmtMarkup,
    rich: (...args: Parameters<fmt.NFmtRich<El>>) => this.nfmtRich(...args),
  })
}
