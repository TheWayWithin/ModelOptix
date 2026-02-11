# LinkedIn Post — February 11, 2026

**Character count**: ~920

---

I investigated adding funding rate arbitrage to my AI trading system as a "choppy market defense."

Three independent experts said no. Here's why the reason is more interesting than you'd think.

The pitch sounds perfect:
When markets trend, your momentum strategy profits.
When markets chop, funding arb profits.
Perfect diversification.

The reality:
Funding rates and trend strength are positively correlated (r = +0.45 to +0.65).

When your momentum bot has nothing to do because the market is ranging, funding rates are also near zero. Your "hedge" produces the same nothing.

In bear markets, funding rates go negative — your "safe" position actively loses money.

It gets worse if you're in the US.

Binance (0.20% round-trip): banned.
Bybit (0.28%): banned.
Coinbase (2.00%): legal.

That's a 10x fee disadvantage for being in the wrong jurisdiction. 67 days to break even on Coinbase vs. 7 days on Binance.

The decision: rejected at our current capital level.

But the real lesson isn't about arb. It's about the discipline to say "no" to a feature that sounds smart but doesn't survive the math.

My AI trading bot has been flat for 34 hours. P&L change: $0.00. Before our latest risk upgrade, it would have lost $59 in the same market. Sometimes the best feature is the one you don't build.

Full technical analysis: jamiewatters.work/progress/2026-02-11

Have you ever killed a feature idea that sounded brilliant on paper but fell apart in the numbers?

---

**Author**: Jamie Watters
**Twitter/X**: @Jamie_within
**Build site**: jamiewatters.work
