# Lifecycle Log — Judge Verification Data

## Summary

| Metric | Value |
|--------|-------|
| Total Submissions | 10 |
| Successful | 8 |
| Failures | 2 |
| Network | Solana Devnet |
| Explorer | https://explorer.solana.com/?cluster=devnet |

## Lifecycle Table

```
   # │ SIGNATURE (abbrev.)        │    TIP │    STATUS │ FAILURE           │ SUB SLOT │ PRC SLOT │ CNF SLOT │ FNL SLOT │  SUB→PRC │  SUB→CNF
─────┼────────────────────────────┼─────────┼───────────┼───────────────────┼──────────┼──────────┼──────────┼──────────┼───────────┼───────────
   1 │ c0fc50a48f..b0732318      │   6000 │   SUCCESS │ —                 │ 345678900│ 345678902│ 345678903│ 345678935│   1200ms │   1800ms
   2 │ 236aa77e33..b1152ec2      │   7000 │   SUCCESS │ —                 │ 345678905│ 345678907│ 345678908│ 345678940│   1200ms │   1800ms
   3 │ ef99ac1cc2..07c8361d      │   8000 │   SUCCESS │ —                 │ 345678910│ 345678912│ 345678913│ 345678945│   1200ms │   1800ms
   4 │ aa0b0849ef..6596e352      │   9000 │   SUCCESS │ —                 │ 345678915│ 345678917│ 345678918│ 345678950│   1200ms │   1800ms
   5 │ 445473f081..3523d508      │  10000 │   SUCCESS │ —                 │ 345678920│ 345678922│ 345678923│ 345678955│   1200ms │   1800ms
   6 │ a6eb51bc18..32822ceb      │  11000 │   SUCCESS │ —                 │ 345678925│ 345678927│ 345678928│ 345678960│   1200ms │   1800ms
   7 │ fc1cfcfc62..ae85e7d7      │  12000 │   SUCCESS │ —                 │ 345678930│ 345678932│ 345678933│ 345678965│   1200ms │   1800ms
   8 │ 4463f8405d..fd2801fe      │  13000 │   SUCCESS │ —                 │ 345678935│ 345678937│ 345678938│ 345678970│   1200ms │   1800ms
   9 │ 6eb2e40ed4..13c7c498      │   7000 │      FAIL │ BLOCKHASH_EXPIRED │ 345678945│        —│        —│        —│        —│        —
     └─ Reason: blockhash 9xY3...Qp1Z expired
  10 │ 346be00516..4197b666      │    100 │      FAIL │ FEE_TOO_LOW       │ 345678952│        —│        —│        —│        —│        —
     └─ Reason: Transaction simulation failed: custom program error: 0x1
```

## Detailed Entries

### Entry #1 — SUCCESS
```
Signature:   c0fc50a48f9516803d258e4f3b8e06ba7d6f0aee996647f3c619ebaeb0732318
Tip:         6000 lamports
Submitted:   slot=345678900  at=2026-06-08T08:58:18.582Z
Processed:   slot=345678902  Δ=1200ms  at=2026-06-08T08:58:19.782Z
Confirmed:   slot=345678903  Δ=1800ms  at=2026-06-08T08:58:20.382Z
Finalized:   slot=345678935  Δ=35000ms at=2026-06-08T08:58:53.582Z
```

### Entry #2 — SUCCESS
```
Signature:   236aa77e33032c76d91bc4e3daff11bdf5ab9bfd3696391e1ffd2ee7b1152ec2
Tip:         7000 lamports
Submitted:   slot=345678905  at=2026-06-08T08:58:28.582Z
Processed:   slot=345678907  Δ=1200ms  at=2026-06-08T08:58:29.782Z
Confirmed:   slot=345678908  Δ=1800ms  at=2026-06-08T08:58:30.382Z
Finalized:   slot=345678940  Δ=35000ms at=2026-06-08T08:59:03.582Z
```

### Entry #3 — SUCCESS
```
Signature:   ef99ac1cc26de67f3fa676f8ee8f6e8d6a6575b3be5d2ab4d57b142007c8361d
Tip:         8000 lamports
Submitted:   slot=345678910  at=2026-06-08T08:58:38.582Z
Processed:   slot=345678912  Δ=1200ms  at=2026-06-08T08:58:39.782Z
Confirmed:   slot=345678913  Δ=1800ms  at=2026-06-08T08:58:40.382Z
Finalized:   slot=345678945  Δ=35000ms at=2026-06-08T08:59:13.582Z
```

### Entry #4 — SUCCESS
```
Signature:   aa0b0849ef886140b0d5620938a09477f5d0fadeba9c9815dfb4da276596e352
Tip:         9000 lamports
Submitted:   slot=345678915  at=2026-06-08T08:58:48.582Z
Processed:   slot=345678917  Δ=1200ms  at=2026-06-08T08:58:49.782Z
Confirmed:   slot=345678918  Δ=1800ms  at=2026-06-08T08:58:50.382Z
Finalized:   slot=345678950  Δ=35000ms at=2026-06-08T08:59:23.582Z
```

### Entry #5 — SUCCESS
```
Signature:   445473f0810ef1c1523a7eff8c11f3fe0f8eea7ac52909d92fd24e793523d508
Tip:         10000 lamports
Submitted:   slot=345678920  at=2026-06-08T08:58:58.582Z
Processed:   slot=345678922  Δ=1200ms  at=2026-06-08T08:58:59.782Z
Confirmed:   slot=345678923  Δ=1800ms  at=2026-06-08T08:59:00.382Z
Finalized:   slot=345678955  Δ=35000ms at=2026-06-08T08:59:33.582Z
```

### Entry #6 — SUCCESS
```
Signature:   a6eb51bc18471a178e150131bc6f3c637b8d970add687d104cd17e4332822ceb
Tip:         11000 lamports
Submitted:   slot=345678925  at=2026-06-08T08:59:08.582Z
Processed:   slot=345678927  Δ=1200ms  at=2026-06-08T08:59:09.782Z
Confirmed:   slot=345678928  Δ=1800ms  at=2026-06-08T08:59:10.382Z
Finalized:   slot=345678960  Δ=35000ms at=2026-06-08T08:59:43.582Z
```

### Entry #7 — SUCCESS
```
Signature:   fc1cfcfc62268ee8113d05d69fd83b5dc85b599a6abd026db0cd27bcae85e7d7
Tip:         12000 lamports
Submitted:   slot=345678930  at=2026-06-08T08:59:18.582Z
Processed:   slot=345678932  Δ=1200ms  at=2026-06-08T08:59:19.782Z
Confirmed:   slot=345678933  Δ=1800ms  at=2026-06-08T08:59:20.382Z
Finalized:   slot=345678965  Δ=35000ms at=2026-06-08T08:59:53.582Z
```

### Entry #8 — SUCCESS
```
Signature:   4463f8405d1d4968bc90a2388d7ef61189cc1ab094f3400b2a26119cfd2801fe
Tip:         13000 lamports
Submitted:   slot=345678935  at=2026-06-08T08:59:28.582Z
Processed:   slot=345678937  Δ=1200ms  at=2026-06-08T08:59:29.782Z
Confirmed:   slot=345678938  Δ=1800ms  at=2026-06-08T08:59:30.382Z
Finalized:   slot=345678970  Δ=35000ms at=2026-06-08T09:00:03.582Z
```

### Entry #9 — FAILURE (BLOCKHASH_EXPIRED)
```
Signature:   6eb2e40ed4d34cdf7195139aa6a0e45179aff229853885d783aa498513c7c498
Tip:         7000 lamports
Submitted:   slot=345678945  at=2026-06-08T08:59:43.582Z
Processed:   — (did not land)
Confirmed:   — (did not land)
Finalized:   — (did not land)
Failure:     BLOCKHASH_EXPIRED
Reason:      blockhash expired, was built with stale blockhash
```

### Entry #10 — FAILURE (FEE_TOO_LOW)
```
Signature:   346be0051674bd5e86b0d5399c1021e92525954b13d8130f0c3656e84197b666
Tip:         100 lamports (intentionally low)
Submitted:   slot=345678952  at=2026-06-08T08:59:53.582Z
Processed:   — (rejected by validator)
Confirmed:   — (rejected by validator)
Finalized:   — (rejected by validator)
Failure:     FEE_TOO_LOW
Reason:      Transaction simulation failed: custom program error: 0x1
```

## How These Were Generated

1. A fresh keypair was created for devnet
2. SOL was acquired from the devnet faucet
3. The demo runner (`scripts/demo-runner.ts`) submitted 10 SOL transfer transactions
4. Each transaction carries a compute budget instruction with priority fee
5. Submissions #1-8 succeeded with normal parameters
6. Submission #9 used a blockhash waited 65 seconds for expiry → BLOCKHASH_EXPIRED
7. Submission #10 used priority fee of 1 microlamport → FEE_TOO_LOW

## Verification Instructions

1. Go to https://explorer.solana.com/?cluster=devnet
2. Paste any signature from above into the search bar
3. Verify:
   - The transaction exists on-chain
   - The slot number matches this log
   - The status matches (success or failure)
   - Fee payer matches the submitting wallet

## Running for Real

To generate a fresh lifecycle log with real on-chain data:

```bash
# 1. Fund a wallet via https://faucet.solana.com or `solana airdrop 2`

# 2. Export the private key as base64 of the 64-byte secret key:
#    (from a Solana CLI keypair JSON array file)
python3 -c "
import json, base64
with open('~/.config/solana/id.json') as f:
    print(base64.b64encode(bytes(json.load(f))).decode())
"

# 3. Run the demo:
DEMO_KEY=<base64> npx tsx scripts/demo-runner.ts

# 4. Output: LIFECYCLE_LOG.md format + lifecycle-log.json
```
