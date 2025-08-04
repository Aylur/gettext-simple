"use client"

import { createContext, use, useState, type ReactNode } from "react"
import type { PoJson } from "./po2json"
import { Gettext } from "./gettext"

const GettextContext = createContext({
  gettext: new Gettext(),
  setMessages: (messages: Partial<PoJson>) => void messages,
})

export function GettextProvider(props: {
  messages?: Partial<PoJson>
  children?: ReactNode
}) {
  const [gettext, setGettext] = useState<Gettext>(new Gettext(props.messages))
  const setMessages = (m: Partial<PoJson>) => void setGettext(new Gettext(m))

  return (
    <GettextContext value={{ gettext, setMessages }}>
      {props.children}
    </GettextContext>
  )
}

export function useGettext() {
  const ctx = use(GettextContext)

  return Object.assign(ctx.gettext.gettext, {
    gettext: ctx.gettext.gettext,
    pgettext: ctx.gettext.pgettext,
    ngettext: ctx.gettext.ngettext,
    setMessages: ctx.setMessages,
  })
}
