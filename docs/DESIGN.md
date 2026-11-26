# Mini app design

## Concept: a night shop window

Dreams are bought for a particular night, so the shop lives at night. The interface is a deep
midnight blue, and the only light sources are the cover illustrations: pastel windows in a
dark street. Everything else stays quiet so the covers do the selling.

- **One look everywhere.** The shop does not take Telegram's theme colours: a pastel cover on
  a random light or dark Telegram theme looked accidental. Instead the app tells Telegram to paint
  its header and background in the shop's own night colour.
- **One accent.** Dawn: a warm peach taken from the covers' sunrise tones. It marks the single
  primary action on each screen and the current state (chosen night, active tab, order step).
- **Type.** Cormorant italic for names and headings — the dream is the product, and the serif
  makes it feel like a story title. Manrope for everything functional: prices, labels, buttons.
- **The night is the main choice.** Picking a night is a horizontal strip of days (radio group),
  not a dropdown: the buyer sees the week at a glance, and the rules (two dreams, six hours a
  night) read naturally per night in the cart.

## Tokens

All tokens live in `src/app/app/shop.module.css` on `.shop`. Components use only the tokens.

| Token | Value | Use |
| --- | --- | --- |
| `--bg` | `#0b0a1a` | page |
| `--surface` | `#15132b` | cards, sheets |
| `--surface-2` | `#1e1b3a` | controls, chips |
| `--text` | `#f3efff` | main text (16:1 on `--bg`) |
| `--muted` | `#a9a3c9` | secondary text (7.6:1) |
| `--dawn` | `#ffc8a2` | primary action and current state |
| `--on-dawn` | `#1b1230` | text on dawn (11:1) |
| `--success` | `#9fe3c1` | added, delivered |
| `--danger` | `#ff9fb0` | errors |

Spacing follows a 4 px scale, touch targets are at least 44 px, radius 20 / 14 / 999.

## Motion

Short and functional: press feedback (scale 0.97, 120 ms), cards fade in once, the order
progress fills when the status changes. With `prefers-reduced-motion` all of it is off.

## Accessibility

- Text contrast is at least 4.5:1, focus is a 2 px dawn ring.
- The night strip is a native radio group, steppers have labels, statuses are announced
  with `role="status"`.
- The demo checkout shows its fictional data as text, not as disabled inputs.
