"use client"

import {
  createContext,
  use,
  useEffect,
  useMemo,
  useState,
  Fragment,
  type PropsWithChildren,
  type JSX,
} from "react"
import type { PoJson } from "./po2json"
import {
  Gettext,
  type Text,
  type Values,
  type AstNode,
  format,
} from "./gettext.js"

type Messages = Partial<PoJson>

function render(
  nodes: AstNode[],
  fns: Record<string, (s: JSX.Element) => JSX.Element>,
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

export function fmt<const S extends string>(
  input: Text<S>,
  values: Values<Text<S>, JSX.Element>,
) {
  const { tags, nodes } = format(input, values)
  return render(nodes, tags)
}

const GettextContext = createContext({
  gettext: new Gettext(),
  setMessages: (messages: Messages) => {
    void messages
    console.error("calling setMessages without a GettextProvider")
  },
  setGettext: (gettext: Gettext) => {
    void gettext
    console.error("calling setGettext without a GettextProvider")
  },
})

export function GettextProvider(
  props: PropsWithChildren<
    | { messages?: Messages; gettext?: never }
    | { messages?: never; gettext?: Gettext }
  >,
) {
  const [gettext, setGettext] = useState<Gettext>(
    props.gettext ?? new Gettext(props.messages),
  )

  const [setMessages] = useState(
    () => (m: Messages) => setGettext(new Gettext(m)),
  )

  useEffect(() => {
    setGettext(
      props.messages
        ? new Gettext(props.messages)
        : (props.gettext ?? new Gettext()),
    )
  }, [props.gettext, props.messages])

  return (
    <GettextContext value={{ gettext, setMessages, setGettext }}>
      {props.children}
    </GettextContext>
  )
}

export type GettextReact = Gettext["gettext"] & {
  gettext: Gettext["gettext"]
  pgettext: Gettext["pgettext"]
  ngettext: Gettext["ngettext"]
}

type UseGettextReact = GettextReact & {
  setMessages(messages: Messages): void
  setGettext(gettext: Gettext): void
}

export function useGettext(): UseGettextReact {
  const ctx = use(GettextContext)

  return useMemo(
    () =>
      Object.assign(ctx.gettext.gettext, {
        gettext: ctx.gettext.gettext,
        pgettext: ctx.gettext.pgettext,
        ngettext: ctx.gettext.ngettext,
        setMessages: ctx.setMessages,
        setGettext: ctx.setGettext,
      }),
    [ctx],
  )
}
