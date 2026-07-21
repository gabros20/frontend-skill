# Docs index

Three documents cover using `frontend`. Each has one job — read in this order the first time, then
jump straight to whichever one answers your question.

| Doc | Type | Answers |
|---|---|---|
| [installation.md](installation.md) | How-to | How do I install and verify `frontend` in Codex or another host? |
| [usage.md](usage.md) | Reference | How does the skill trigger, how does the faceted router work, and what does each route produce? |
| [recipes.md](recipes.md) | How-to | What's the exact prompt for `<scenario>`? |

## Reading order

1. **[installation.md](installation.md)** — install it and confirm the host discovers it.
2. **[usage.md](usage.md)** — how it triggers, the primary-job / platform / web-stack routing
   model, the universal invariants every artifact answers to, and what each route produces. Read
   this once, fully; everything else builds on it.
3. **[recipes.md](recipes.md)** — copy-paste scenario prompts. Keep this one open while you work.

If you only read one page, read **usage.md** — it's the full control surface; recipes are shortcuts
on top of it.

---

`frontend` is the Build-stage skill of the
[Digital Product Skills](https://github.com/gabros20/digital-product-skill) family: production
client implementation across websites, web apps, iOS, and Android. This repository is
independently versioned as `frontend-skill`; the runtime identifier remains `frontend`.

Maintainers should read [AGENTS.md](../AGENTS.md) for repository invariants and
[CONTRIBUTING.md](../CONTRIBUTING.md) for validation and release steps.
