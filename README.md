# Runlytics

A simple calculator that tells you how long your money will last.

You type in how much cash you have and how much you spend each month, and it tells you when you'll run out.

## What's in this project

- `index.html` — the page
- `style.css` — how it looks
- `app.js` — the math
- `README.md` — this file

## How to run it

Just double-click `index.html` and it opens in your browser. No installing anything.

## How to use it

1. **Cash on hand** — how much money you have
2. **Monthly burn** — how much you spend per month
3. **Monthly revenue** — how much you earn per month (put 0 if none)
4. **Revenue growth** — how much your revenue grows each month, in percent (put 0 if not sure)

The result on the right tells you how many months you have left.

## What the colors mean

- Green — you're fine
- Yellow — be careful
- Red — you're running out of money soon

## The math

If you don't have growing revenue, it's just:

```
months left = cash ÷ monthly burn
```

If you do have growing revenue, the app subtracts a little less from your cash each month as your revenue grows.

## Built with

Plain HTML, CSS, and JavaScript. No frameworks. No libraries. No build step.
