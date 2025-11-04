export type TemplateStrings<S> =
  S extends `${infer _}{{${infer K}}}${infer Rest}`
    ? K | TemplateStrings<Rest>
    : never

type TagName<T> = T extends `/${infer N}`
  ? TagName<N>
  : T extends `${infer N} ${string}`
    ? TagName<N>
    : T extends `${infer N}/`
      ? TagName<N>
      : T

export type HtmlTags<S> = S extends `${string}<${infer T}>${infer Rest}`
  ? TagName<T> | HtmlTags<Rest>
  : never

export type AstNode =
  | { type: "text"; value: string }
  | { type: "el"; name: string; children: AstNode[] }

export function parseToAst(input: string): AstNode[] {
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
