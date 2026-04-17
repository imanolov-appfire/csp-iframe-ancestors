# Forge tunnel + custom domain CSP repro

Minimal Forge app that demonstrates a `frame-ancestors` Content Security Policy
violation which occurs **only** under `forge tunnel`, **only** when the target
Jira site is served on a customer custom domain.

## What it does

One Custom UI `jira:projectPage` that renders a page with a single iframe
pointing at `./embedded.html` &mdash; an HTML file served from the **same**
Forge resource (same origin, same tunnel port). Parent and child are
therefore same-origin and `'self'` alone would satisfy the directive for the
immediate parent.

## What breaks

Under `forge tunnel`, the Forge edge injects this header on every response from
`http://localhost:<port>`:

```
Content-Security-Policy: frame-ancestors 'self' *.atlassian.net bitbucket.org
  *.jira.com *.atlassian.com *.frontend.public.atl-paas.net
  https://tdp-os.services.atlassian.com/fos-eap/download/
  https://tdp-os.services.atlassian.com/fos/app/download/
  https://tdp-os.services.atlassian.com/fos/cdn/download/
```

`frame-ancestors` is evaluated against the **entire ancestor chain**, not just
the immediate parent. When the top ancestor is a customer custom domain
(e.g. `jira.<customer>.com`), it matches no entry in the list and the browser
blocks the frame:

```
Framing 'http://localhost:<port>/' violates the following Content Security
Policy directive: "frame-ancestors 'self' *.atlassian.net ...". The request
has been blocked.
```

## Expected behaviour (matrix)

| Target Jira site     | `forge tunnel` | Production |
| -------------------- | -------------- | ---------- |
| `*.atlassian.net`    | OK             | OK         |
| Custom domain        | **BLOCKED**    | OK         |

The iframe is blocked in exactly one cell of that matrix, which is the bug.

## Reproduce

Prereqs: Node 20.x, `@forge/cli`, a cloud developer account, a Jira site on a
custom domain.

```bash
npm install
npm install --prefix static/hello-world
npm run build:ui

forge register
forge install --product jira --site jira.<customer>.com
forge tunnel
```

Open the `CSP Iframe Repro` project page in the Jira site on the custom domain.
Open DevTools console and observe the `frame-ancestors` violation above.

Repeat against a stock `*.atlassian.net` site; the same iframe loads cleanly.
Run `forge deploy` and test in production on the custom-domain site; the
iframe also loads cleanly there. Only the `forge tunnel` + custom-domain
combination fails.

## Why this blocks local development

Any Forge app whose UI mounts iframes (sandboxed code execution, embedded
sub-pages, documentation frames, etc.) cannot be developed or debugged with
`forge tunnel` against a customer who is on a custom domain. We can only
validate fixes through full `forge deploy` + `forge install` cycles, defeating
the purpose of tunnel mode for this class of bugs.

## Proposed fix

When `forge tunnel` injects `frame-ancestors`, make it match what production
would serve for the specific target site &mdash; i.e. include that site's
configured custom domain(s). Production already does this; tunnel mode does
not.
