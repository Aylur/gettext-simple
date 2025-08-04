import type { Messages, PoJson } from "./po2json"

export class Gettext {
  public messages: Messages = {}

  #pluralFunc!: (n: number) => number
  #pluralForm!: string

  set pluralForm(value: string) {
    this.#pluralForm = value

    this.#pluralFunc = Function(
      "n",
      "let plural, nplurals; " + value + " return Number(plural);",
    ) as (n: number) => number
  }

  get pluralForm() {
    return this.#pluralForm
  }

  constructor({
    pluralForms = "nplurals=2; plural=(n != 1);",
    messages = { "": {} },
  }: Partial<PoJson> = {}) {
    this.pluralForm = pluralForms
    this.messages = messages
  }

  gettext = (msgid: string): string => {
    if (msgid in this.messages[""]) {
      const msg = this.messages[""][msgid]
      return (Array.isArray(msg) ? msg.at(1) : msg) ?? msgid
    }

    return msgid
  }

  ngettext = (msgid1: string, msgid2: string, n: number): string => {
    const index = this.#pluralFunc(n)
    return this.messages[""][msgid1]?.at(index) ?? (n === 1 ? msgid1 : msgid2)
  }

  pgettext = (msgctxt: string, msgid: string): string => {
    const msg = this.messages[msgctxt]?.[msgid] ?? msgid
    return (Array.isArray(msg) ? msg.at(0) : msg) ?? msgid
  }
}
