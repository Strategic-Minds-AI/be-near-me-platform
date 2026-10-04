# BNM Proof Gate V1

This gate exists to stop AI-generated or legacy drift from being called "done."

It is deliberately binary:

- PASS only when the locked manifest is intact, all 10 approved screen records are present and unique, required locked routes are mounted, the parity threshold remains >=94 with 0 critical failures, and forbidden legacy route surfaces are absent.
- FAIL otherwise.

It does not judge whether something "looks good." It checks source truth and produces a machine-readable receipt.

Run:

```bash
node proof-gate/proof-gate.mjs
```

Receipt:

`proof-gate/receipts/latest.json`

Rule: **NO EVIDENCE = NO PASS.**
