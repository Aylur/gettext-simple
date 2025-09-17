"use client"

import {
  createContext,
  use,
  useEffect,
  useMemo,
  useState,
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
