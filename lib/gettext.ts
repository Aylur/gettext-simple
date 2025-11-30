import type { Messages, PoJson } from "./po2json"

const { fromEntries, entries } = Object

declare const slots: unique symbol
declare const tags: unique symbol

export type Text<T> = T & {
  [slots]: TemplateStrings<T>
  [tags]: HtmlTags<T>
}

export class Gettext {
  readonly lang: string
  private readonly messages: Messages
  private readonly pluralFunc!: (n: number) => number

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

  gettext = <const S extends string>(msgid: S): Text<S> => {
    if (msgid in this.messages[""]) {
      const msg = this.messages[""][msgid]
      return ((Array.isArray(msg) ? msg.at(1) : msg) ?? msgid) as Text<S>
    }

    return msgid as Text<S>
  }

  ngettext = <const S1 extends string, const S2 extends string>(
    msgid1: S1,
    msgid2: S2,
    n: number,
  ): Text<S1 | S2> => {
    const index = this.pluralFunc(n)
    return (this.messages[""][msgid1]?.at(index) ??
      (n === 1 ? msgid1 : msgid2)) as Text<S1 | S2>
  }

  pgettext = <const S extends string>(msgctxt: string, msgid: S): Text<S> => {
    const msg = this.messages[msgctxt]?.[msgid] ?? msgid
    return ((Array.isArray(msg) ? msg.at(0) : msg) ?? msgid) as Text<S>
  }
}

type TemplateStrings<S> = S extends `${infer _}{{${infer K}}}${infer Rest}`
  ? K | TemplateStrings<Rest>
  : never

type TagName<T> = T extends `/${infer N}`
  ? TagName<N>
  : T extends `${infer N} ${string}`
    ? TagName<N>
    : T extends `${infer N}/`
      ? TagName<N>
      : T

type HtmlTags<S> = S extends `${string}<${infer T}>${infer Rest}`
  ? TagName<T> | HtmlTags<Rest>
  : never

export type AstNode =
  | { type: "text"; value: string }
  | { type: "el"; name: string; children: AstNode[] }

function parseToAst(input: string): AstNode[] {
  const root: AstNode = { type: "el", name: "__root__", children: [] }
  const stack: Array<{ name: string; children: AstNode[] }> = [root]

  const tagRe = /<\s*\/?\s*([a-zA-Z0-9]+)[^>]*?>/g

  let lastIdx = 0
  let m: RegExpExecArray | null

  const peek = () => stack[stack.length - 1]

  const pushText = (s: string) =>
    s && peek().children.push({ type: "text", value: s })

  while ((m = tagRe.exec(input))) {
    const full = m[0]
    const rawName = m[1]
    const name = rawName.toLowerCase()

    pushText(input.slice(lastIdx, m.index))
    lastIdx = m.index + full.length

    const isClosing = /^<\s*\//.test(full)
    const isSelfClosing = /\/\s*>$/.test(full)

    if (isClosing) {
      for (let i = stack.length - 1; i > 0; i--) {
        if (stack[i].name === name) {
          const node = stack.pop()!
          peek().children.push({
            type: "el",
            name: node.name,
            children: node.children,
          })
          break
        }
      }
    } else if (isSelfClosing) {
      peek().children.push({ type: "el", name, children: [] })
    } else {
      stack.push({ name, children: [] })
    }
  }

  // trailing text
  pushText(input.slice(lastIdx))

  // close any still-open tags
  while (stack.length > 1) {
    const node = stack.pop()!
    peek().children.push({
      type: "el",
      name: node.name,
      children: node.children,
    })
  }

  return root.children
}

type Prettify<T> = { [K in keyof T]: T[K] } & {}

export type Values<S, El> = S extends {
  [slots]: any
  [tags]: any
}
  ? [S[typeof slots], S[typeof tags]] extends [never, never]
    ? never
    : Prettify<
        Record<S[typeof slots], string | number> &
          Record<S[typeof tags], (content: El) => El>
      >
  : never

export function format<T extends string, El>(
  input: Text<T>,
  values: Values<Text<T>, El>,
) {
  const slots = fromEntries(
    entries(values).filter(
      (v): v is [string, string | number] =>
        typeof v[1] === "string" || typeof v[1] === "number",
    ),
  )

  const tags = fromEntries(
    entries(values).filter(
      (v): v is [string, (content: El) => El] => typeof v[1] === "function",
    ),
  )

  const text = input.replace(
    /\{\{([^{}]+)\}\}/g,
    (match, key: string) => `${slots[key] ?? match}`,
  )

  const nodes = parseToAst(text)

  return { input, slots, text, tags, nodes }
}

function render(
  nodes: AstNode[],
  fns: Record<string, (s: string) => string>,
): string[] {
  return nodes.map((n) => {
    if (n.type === "text") {
      return n.value
    } else {
      const content = render(n.children, fns).join("")
      return fns[n.name]?.(content) ?? content
    }
  })
}

export function fmt<const S extends string>(
  input: Text<S>,
  values: Values<Text<S>, string>,
) {
  const { tags, nodes } = format(input, values)
  return render(nodes, tags).join("")
}
