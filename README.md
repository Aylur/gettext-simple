# Gettext

Why overcomplicate translations with libraries like `next-intl` when translating
text has been a solved problem since 1995?

When iterating on a project you should not have to worry about

- giving an ID to a text
- structuring a json file
- jumping between translations and components

## Exmaple

Requires 0 setup to get started.

```tsx
import { useGettext, fmt } from "gettext-simple/react"

function Component() {
  const [count, setCount] = useState(0)
  const { gettext: t, ngettext: n } = useGettext()

  return (
    <main>
      <button onClick={() => setCount((c) => c + 1)}>
        {t("Add an apple")}
      </button>
      <p>
        {fmt(n("There is one apple", "Number of apples: {{count}}", count), {
          count: count,
        })}
      </p>
      {fmt(t("Click <link>here</link> for more)"), {
        link: (child) => <a>{child}</a>,
      })}
    </main>
  )
}
```

## Adding translations

1. To extract translatable text, use `xgettext`.

   ```sh
   xgettext **/\*.ts **/\*.tsx \
     --from-code=UTF-8 \
     --output=messages.pot \
     --language=JavaScript \
     --keyword=p:1c,2 \
     --keyword=t \
     --keyword=n:1,2
   ```

2. Init `.po` files

   ```sh
   msginit --locale=yourlocale --input=messages.pot
   ```

3. After filling it in, turn it into a json file.

   ```sh
   ./node_modules/.bin/gettext-simple yourlocale.po yourlocale.json
   ```

4. Wrap your app in a `GettextProvider`

   ```tsx
   import { GettextProvider } from "gettext-simple/react"
   import messages from "./messages.json"

   <GettextProvider messages={messages}>
     <App />
   <GettextProvider>
   ```

## Maintaining translations

1. Regenerate .pot file with `xgettext` as seen above

2. Merge messages

   ```sh
   for po in po/*.po; do
     msgmerge --update --backup=off "$po" po/messages.pot
     # optionally remove obsolete messages
     msgattrib --no-obsolete --output-file="$po" "$po"
   done
   ```

## Todo

- [ ] add error logs for missing messages in dev mode when messages object is
      non empty in Gettext
- [ ] add support for Astro
- [ ] add support for Solid
- [ ] add support for Svelte
- [ ] add support for Vue
