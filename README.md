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
        {fmt(n("There is one apple", "Number of apples: {{count}}"), {
          count: count,
        })}
      </p>
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
   msginit --locale=hu --input=messages.pot
   ```

3. After filling it in, turn it into a json file.

   ```sh
   ./node_modules/.bin/gettext-simple locale.po messages.json
   ```

4. Wrap your app in a `GettextProvider`

   ```tsx
   import { GettextProvider } from "gettext-simple/react"
   import messages from "./messages.json"

   <GettextProvider messages={messages}>
     <App />
   <GettextProvider>
   ```
