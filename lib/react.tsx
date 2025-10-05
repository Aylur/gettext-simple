"use client"

import {
  createContext,
  use,
  useEffect,
  useMemo,
  useState,
  Fragment,
  type ReactNode,
} from "react"
import type { PoJson } from "./po2json"
import { Gettext } from "./gettext.js"

type Messages = Partial<PoJson>

const GettextContext = createContext({
  gettext: new Gettext(),
  setMessages: (messages: Messages) => void messages,
})

export function GettextProvider(props: {
  messages?: Messages
  children?: ReactNode
}) {
  const [gettext, setGettext] = useState<Gettext>(new Gettext(props.messages))
  const setMessages = (m: Messages) => void setGettext(new Gettext(m))
  useEffect(() => setMessages(props.messages ?? {}), [props.messages])

  return (
    <GettextContext value={{ gettext, setMessages }}>
      {props.children}
    </GettextContext>
  )
}

export function useGettext() {
  const ctx = use(GettextContext)

  return useMemo(
    () =>
      Object.assign(ctx.gettext.gettext, {
        gettext: ctx.gettext.gettext,
        pgettext: ctx.gettext.pgettext,
        ngettext: ctx.gettext.ngettext,
        setMessages: ctx.setMessages,
      }),
    [ctx],
  )
}

type TemplateStrings<S extends string> =
  S extends `${infer _Before}{{${infer K}}}${infer Rest}`
    ? K | TemplateStrings<Rest>
    : never

export function fmt<T extends string>(
  template: T,
  values: Record<TemplateStrings<T>, React.ReactNode>,
): React.ReactNode {
  const parts = template.split(/(\{\{.*?\}\})/g) // keep the {{key}} tokens

  return (
    <>
      {parts.map((part, i) => {
        const match = part.match(/^\{\{(.*?)\}\}$/)
        return match ? (
          <Fragment key={i}>
            {values[match[1].trim() as TemplateStrings<T>]}
          </Fragment>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        )
      })}
    </>
  )
}
