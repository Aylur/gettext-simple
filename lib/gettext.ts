import type { Messages, PoJson } from "./po2json"

export class Gettext {
  #pluralFunc!: (n: number) => number
  #pluralForm!: string
  #lang: string
  #messages: Messages

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

  get messages() {
    return this.#messages
  }

  get lang() {
    return this.#lang
  }

  constructor({
    pluralForms = "nplurals=2; plural=(n != 1);",
    lang = "en",
    messages = { "": {} },
  }: Partial<PoJson> = {}) {
    this.#lang = lang
    this.#messages = messages
    this.pluralForm = pluralForms
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
