import type { Messages, PoJson } from "./po2json"

type TemplateStrings<S extends string> =
  S extends `${infer _Before}{{${infer K}}}${infer Rest}`
    ? K | TemplateStrings<Rest>
    : never

export function fmt<T extends string>(
  str: T,
  values: Record<TemplateStrings<T>, string>,
) {
  let builder: string = str
  for (const [key, value] of Object.entries(values)) {
    builder = builder.replaceAll(`{{${key}}}`, `${value}`)
  }
  return builder
}

export class Gettext {
  #pluralFunc!: (n: number) => number
  #pluralForm!: string
  #lang: string
  #messages: Messages

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
    this.#pluralForm = pluralForms

    this.#pluralFunc = Function(
      "n",
      "let plural, nplurals; " + pluralForms + " return Number(plural);",
    ) as (n: number) => number
  }

  gettext = <const T extends string>(msgid: T): T => {
    if (msgid in this.messages[""]) {
      const msg = this.messages[""][msgid]
      return ((Array.isArray(msg) ? msg.at(1) : msg) as T) ?? msgid
    }

    return msgid
  }

  ngettext = <const T1 extends string, const T2 extends string>(
    msgid1: T1,
    msgid2: T2,
    n: number,
  ): T1 | T2 => {
    const index = this.#pluralFunc(n)
    return (
      (this.messages[""][msgid1]?.at(index) as T1) ??
      (n === 1 ? msgid1 : msgid2)
    )
  }

  pgettext = <const T extends string>(msgctxt: string, msgid: T): T => {
    const msg = this.messages[msgctxt]?.[msgid] ?? msgid
    return ((Array.isArray(msg) ? msg.at(0) : msg) as T) ?? msgid
  }
}
