# Mini app design

## Concept: a dreamy morning

The covers are soft pastel illustrations, so the shop is built around them: a light lavender
background with blurred colour clouds (peach, lavender, sky blue) and frosted-glass cards on top.
It feels like waking up from a good dream, and the covers read as part of the same world.

- **One look everywhere.** The shop does not take Telegram's theme colours: pastel covers on a
  random light or dark Telegram theme looked accidental. The app asks Telegram to paint its header
  and background in the shop's own `--bg`.
- **One accent.** A lavender gradient marks the single primary action on each screen and the
  current state: the chosen mood or night, the active tab, order progress.
- **Glass, not boxes.** Cards are translucent white with a white edge and a background blur;
  depth comes from the colour clouds behind them, not from heavy shadows.
- **One typeface.** Manrope (with Cyrillic): soft geometric shapes that match the rounded UI.
- **The night is the main choice.** Picking a night is a horizontal strip of days (a radio group),
  not a dropdown: the buyer sees the week at a glance, and the rules (two dreams, six hours a
  night) read naturally per night in the cart.

## Tokens

All tokens live in `src/app/app/shop.module.css` on `.shop`. Components use only the tokens.

| Token | Value | Use | Contrast on `--bg` |
| --- | --- | --- | --- |
| `--bg` | `#f4f0fa` | page, Telegram header | |
| `--surface` | white 62 % + blur | cards | |
| `--surface-2` | white 90 % | chips, controls | |
| `--text` | `#1d1a2e` | main text | 15:1 |
| `--muted` | `#625c7d` | secondary text | 5.6:1 |
| `--accent` | `#7454dc` | accent text, focus ring | 4.6:1 |
| `--accent-fill` | `#9373ea → #6d4bd8` | primary buttons, selected state | white text 4.5:1 at the centre |
| `--success` | `#17734b` | added, delivered | |
| `--danger` | `#c2384f` | errors | 4.7:1 |

Spacing follows a 4 px scale, touch targets are at least 44 px, radius 24 / 16 / 999.

## Motion

Short and functional: press feedback (scale 0.97, 120 ms), cards rise in once with a small
stagger, the order progress line fills when the status changes. With `prefers-reduced-motion`
all of it is off.

## Accessibility

- Text contrast is at least 4.5:1, focus is a 2 px accent ring.
- The night strip is a native radio group, steppers have labels, statuses are announced
  with `role="status"`.
- The demo checkout shows its fictional data as text, not as disabled inputs.
