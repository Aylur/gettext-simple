import type { HtmlTags, TemplateStrings } from "./ast"

type Prettify<T> = { [K in keyof T]: T[K] } & {}

export type TemplateStringRecord<S = string> = Record<
  TemplateStrings<S>,
  string | number
>

export type ValuesRecord<El, S = string> = TemplateStringRecord<S> &
  Record<HtmlTags<S>, (content: El) => El>

export interface FmtFunction {
  <const I extends string>(
    msgid: I,
    ...values: I extends `${string}{{${string}}}${string}`
      ? [values: Prettify<TemplateStringRecord<I>>]
      : []
  ): string
}

export interface FmtRich<El> {
  <const I extends string>(msgid: I, values: Prettify<ValuesRecord<El, I>>): El
}

export interface FmtMarkup {
  <const I extends string>(
    msgid: I,
    values: Prettify<ValuesRecord<string, I>>,
  ): string
}

export interface Fmt<El> extends FmtFunction {
  rich: FmtRich<El>
  markup: FmtMarkup
  raw<const I extends string>(msgid: I): string
}

export interface NFmtFuntion {
  <const I1 extends string, const I2 extends string>(
    msgid1: I1,
    msgid2: I2,
    n: number,
    ...values: I1 extends `${string}{{${string}}}${string}`
      ? [values: Prettify<TemplateStringRecord<I1 | I2>>]
      : I2 extends `${string}{{${string}}}${string}`
        ? [values: Prettify<TemplateStringRecord<I1 | I2>>]
        : []
  ): string
}

export interface NFmtRich<El> {
  <const I1 extends string, const I2 extends string>(
    msgid1: I1,
    msgid2: I2,
    n: number,
    values: Prettify<ValuesRecord<El, I1 | I2>>,
  ): El
}

export interface NFmtMarkup {
  <const I1 extends string, const I2 extends string>(
    msgid1: I1,
    msgid2: I2,
    n: number,
    values: Prettify<ValuesRecord<string, I1 | I2>>,
  ): string
}

export interface NFmt<El> extends NFmtFuntion {
  rich: NFmtRich<El>
  markup: NFmtMarkup
  raw<const I1 extends string, const I2 extends string>(
    msgid1: I1,
    msgid2: I2,
    n: number,
  ): string
}

export interface PFmtFunction {
  <const I extends string>(
    msgctxt: string,
    msgid1: I,
    ...values: I extends `${string}{{${string}}}${string}`
      ? [values: Prettify<TemplateStringRecord<I>>]
      : []
  ): string
}

export interface PFmtRich<El> {
  <const I extends string>(
    msgctxt: string,
    msgid1: I,
    values: Prettify<ValuesRecord<El, I>>,
  ): El
}

export interface PFmtMarkup {
  <const I extends string>(
    msgctxt: string,
    msgid1: I,
    values: Prettify<ValuesRecord<string, I>>,
  ): string
}

export interface PFmt<El> extends PFmtFunction {
  rich: PFmtRich<El>
  markup: PFmtMarkup
  raw<const I extends string>(msgctxt: string, msgid1: I): string
}

export function fstring(str: string, values: Record<string, string | number>) {
  return str.replace(
    /\{\{([^{}]+)\}\}/g,
    (match, key: string) => `${values[key] ?? match}`,
  )
}

const { fromEntries, entries } = Object

export function get<T>(props: ValuesRecord<T>) {
  return {
    values: fromEntries(
      entries(props).filter(
        (v): v is [string, string | number] =>
          typeof v[1] === "string" || typeof v[1] === "number",
      ),
    ),
    tags: fromEntries(
      entries(props).filter(
        (v): v is [string, (content: T) => T] => typeof v[1] === "function",
      ),
    ),
  }
}
