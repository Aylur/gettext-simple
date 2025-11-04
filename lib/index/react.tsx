"use client"

import {
  createContext,
  use,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
  type ReactNode,
} from "react"
import type { PoJson } from "../po2json"
import { Gettext } from "../gettext/react.js"
import type { Fmt, NFmt, PFmt } from "../format"

type Messages = Partial<PoJson>

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
  const setMessages = (m: Messages) => void setGettext(new Gettext(m))
  useEffect(() => setMessages(props.messages ?? {}), [props.messages])
  useEffect(() => setGettext(props.gettext ?? new Gettext()), [props.gettext])

  return (
    <GettextContext value={{ gettext, setMessages, setGettext }}>
      {props.children}
    </GettextContext>
  )
}

export type GettextReact = Fmt<ReactNode> & {
  gettext: Fmt<ReactNode>
  pgettext: PFmt<ReactNode>
  ngettext: NFmt<ReactNode>
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
