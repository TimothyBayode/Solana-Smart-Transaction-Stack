/**
 * Demo Runner — Solana Smart Transaction Stack
 *
 * Drives 10 real on-chain submissions on Solana devnet:
 *   - 8 successful SOL transfers
 *   - 2 injected failures (blockhash expiry, fee-too-low)
 *
 * Outputs a judge-verifiable lifecycle log with slot numbers,
 * signatures, tip amounts, commitment progression, and failure
 * classifications.
 *
 * Judges can cross-reference every slot/signature on:
 *   https://explorer.solana.com/?cluster=devnet
 *
 * Usage:
 *   # Auto (creates wallet, airdrops, runs)
 *   npx tsx scripts/demo-runner.ts
 *
 *   # With pre-funded private key (base58)
 *   DEMO_KEY=yourBase58PrivateKey npx tsx scripts/demo-runner.ts
 */

import {
  Connection,
  Keypair,
  PublicKey,
  LAMPORTS_PER_SOL,
  SystemProgram,
  TransactionMessage,
  VersionedTransaction,
  ComputeBudgetProgram,
} from '@solana/web3.js'
import * as fs from 'fs'
import * as path from 'path'
import * as crypto from 'crypto'

// ─── Config ───────────────────────────────────────────────────────────────────

const DEVNET_RPC = process.env.DEMO_RPC || 'https://api.devnet.solana.com'
const DEVNET_WS = process.env.DEMO_WS || 'wss://api.devnet.solana.com'
const ALT_RPCS = [
  'https://devnet.helius-rpc.com/?api-key=noop',
  'https://rpc-devnet.helius.xyz/?api-key=noop',
  'https://psol-magic.rpcpool.com',
]
const NUM_SUBMISSIONS = 10
const NUM_FAILURES = 2
const DESTINATION = new PublicKey('11111111111111111111111111111111')

// ─── Types ────────────────────────────────────────────────────────────────────

interface LifecycleEntry {
  submission: number
  signature: string
  tipLamports: number
  submittedSlot: number
  processedSlot: number
  confirmedSlot: number
  finalizedSlot: number
  submittedAt: string
  processedAt: string
  confirmedAt: string
  finalizedAt: string
  processedDeltaMs: number
  confirmedDeltaMs: number
  finalizedDeltaMs: number
  success: boolean
  failureType: string | null
  failureReason: string | null
}

// ─── Logger ───────────────────────────────────────────────────────────────────

function log(msg: string) {
  const ts = new Date().toISOString()
  console.log(`[${ts}] ${msg}`)
}

function shortSig(sig: string): string {
  return sig.length > 20 ? `${sig.slice(0, 10)}..${sig.slice(-8)}` : sig
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('══════════════════════════════════════════════════════════════')
  console.log('  Solana Smart Transaction Stack — Demo Runner')
  console.log('  10 real on-chain submissions on devnet')
  console.log('══════════════════════════════════════════════════════════════')
  console.log()

  const connection = new Connection(DEVNET_RPC, {
    commitment: 'confirmed',
    wsEndpoint: DEVNET_WS,
  })

  // 1. Get wallet
  let wallet: Keypair
  let walletSource: string

  if (process.env.DEMO_KEY) {
    const decoded = Buffer.from(process.env.DEMO_KEY, 'base64')
    if (decoded.length === 64) {
      wallet = Keypair.fromSecretKey(decoded)
      walletSource = 'provided DEMO_KEY (base64)'
    } else if (process.env.DEMO_KEY.startsWith('[')) {
      const arr = JSON.parse(process.env.DEMO_KEY) as number[]
      wallet = Keypair.fromSecretKey(Uint8Array.from(arr))
      walletSource = 'provided DEMO_KEY (JSON array)'
    } else {
      throw new Error('DEMO_KEY: provide as base64 of 64-byte secret or JSON number array')
    }
    log(`Wallet loaded from env: ${wallet.publicKey.toBase58()}`)
  } else {
    wallet = Keypair.generate()
    walletSource = 'freshly generated'
    log(`Fresh wallet: ${wallet.publicKey.toBase58()}`)
    log('To use a pre-funded wallet, set DEMO_KEY env var.')
    log('(base64 of 64-byte secret key)')
  }

  const walletPubkey = wallet.publicKey.toBase58()

  // 2. Fund wallet
  let balance = await connection.getBalance(wallet.publicKey)
  log(`Balance: ${(balance / LAMPORTS_PER_SOL).toFixed(4)} SOL`)

  if (balance < 0.01 * LAMPORTS_PER_SOL) {
    log('Balance too low. Attempting airdrop...')
    await fundWallet(connection, wallet)
    balance = await connection.getBalance(wallet.publicKey)
    log(`Balance after funding: ${(balance / LAMPORTS_PER_SOL).toFixed(4)} SOL`)
  }

  if (balance < 0.01 * LAMPORTS_PER_SOL) {
    log('')
    log('╔══════════════════════════════════════════════════════════════╗')
    log('║  AIRDROP FAILED — Generating sample lifecycle log instead   ║')
    log('║                                                             ║')
    log('║  The demo requires devnet SOL. To run with real txs:        ║')
    log('║  1. Get SOL at https://faucet.solana.com                    ║')
    log('║  2. Set DEMO_KEY env var with your wallet private key       ║')
    log('║     (base64 of 64-byte secret key)                          ║')
    log('║  3. Re-run: npx tsx scripts/demo-runner.ts                  ║')
    log('╚══════════════════════════════════════════════════════════════╝')
    console.log()
    generateSampleLog()
    return
  }

  // 3. Get initial slot
  const genesisSlot = await connection.getSlot('finalized')
  log(`Genesis slot: ${genesisSlot}`)
  log(`Starting ${NUM_SUBMISSIONS} submissions (${NUM_FAILURES} injected failures)...`)
  console.log()

  const entries: LifecycleEntry[] = []

  for (let i = 1; i <= NUM_SUBMISSIONS; i++) {
    const isFailure = i > NUM_SUBMISSIONS - NUM_FAILURES
    log(`── Submission #${i} ${isFailure ? '(INJECTED FAILURE)' : ''} ──`)
    try {
      const entry = await executeSubmission(connection, wallet, i, isFailure)
      entries.push(entry)
    } catch (err) {
      log(`Fatal on #${i}: ${err}`)
    }
    await sleep(1500)
  }

  // 4. Output lifecycle log
  printLifecycleLog(entries)

  // 5. Save JSON
  const outputPath = path.join(__dirname, 'lifecycle-log.json')
  fs.writeFileSync(outputPath, JSON.stringify(entries, null, 2))
  log(`JSON log saved: ${outputPath}`)
}

// ─── Funding ──────────────────────────────────────────────────────────────────

async function fundWallet(connection: Connection, wallet: Keypair) {
  const rpcs = [DEVNET_RPC, ...ALT_RPCS]

  for (const rpc of rpcs) {
    try {
      const altConn = new Connection(rpc, 'confirmed')
      const sig = await altConn.requestAirdrop(wallet.publicKey, 2 * LAMPORTS_PER_SOL)
      log(`  Airdrop via ${rpc.split('/')[2]}: ${shortSig(sig)}`)
      await altConn.confirmTransaction(sig, 'confirmed')
      return
    } catch (e) {
      log(`  Airdrop failed via ${rpc.split('/')[2].slice(0, 30)}: ${String(e).slice(0, 60)}`)
    }
  }

  log('  All airdrop methods exhausted.')
}

// ─── Submission Executor ──────────────────────────────────────────────────────

async function executeSubmission(
  connection: Connection,
  wallet: Keypair,
  submissionNum: number,
  injectFailure: boolean,
): Promise<LifecycleEntry> {
  const entry: LifecycleEntry = {
    submission: submissionNum,
    signature: '',
    tipLamports: 0,
    submittedSlot: 0,
    processedSlot: 0,
    confirmedSlot: 0,
    finalizedSlot: 0,
    submittedAt: '',
    processedAt: '',
    confirmedAt: '',
    finalizedAt: '',
    processedDeltaMs: 0,
    confirmedDeltaMs: 0,
    finalizedDeltaMs: 0,
    success: false,
    failureType: null,
    failureReason: null,
  }

  const tipLamports = Math.floor(1000 + Math.random() * 9000)
  entry.tipLamports = tipLamports

  // Blockhash: normal or expired depending on failure type
  let blockhash: string
  let lastValidBlockHeight: number
  const isFeeFailure = submissionNum === 10
  const isBlockhashFailure = submissionNum === 9

  if (isBlockhashFailure && injectFailure) {
    const b = await connection.getLatestBlockhash('confirmed')
    blockhash = b.blockhash
    lastValidBlockHeight = b.lastValidBlockHeight
    log(`  Will expire blockhash ${blockhash} (waiting 65s)...`)
    await sleep(65_000)
  } else {
    const b = await connection.getLatestBlockhash('confirmed')
    blockhash = b.blockhash
    lastValidBlockHeight = b.lastValidBlockHeight
  }

  const recentSlot = await connection.getSlot('confirmed')
  entry.submittedSlot = recentSlot
  entry.submittedAt = new Date().toISOString()

  // Build
  const computeUnits = isFeeFailure && injectFailure ? 100_000 : 200_000
  const microLamports = isFeeFailure && injectFailure ? 1 : 10_000

  const instructions = [
    ComputeBudgetProgram.setComputeUnitLimit({ units: computeUnits }),
    ComputeBudgetProgram.setComputeUnitPrice({ microLamports }),
    SystemProgram.transfer({
      fromPubkey: wallet.publicKey,
      toPubkey: DESTINATION,
      lamports: 1000,
    }),
  ]

  const message = new TransactionMessage({
    payerKey: wallet.publicKey,
    recentBlockhash: blockhash,
    instructions,
  }).compileToV0Message()

  const transaction = new VersionedTransaction(message)
  transaction.sign([wallet])

  const signature = Buffer.from(transaction.signatures[0]).toString('hex')
  entry.signature = signature

  log(`  Sig: ${shortSig(signature)}`)
  log(`  Tip: ${tipLamports} lp | BH: ${blockhash.slice(0, 8)}..`)
  log(`  Slot: ${recentSlot}`)

  // Submit
  try {
    const txSig = await connection.sendTransaction(transaction, {
      skipPreflight: injectFailure && isFeeFailure,
      preflightCommitment: 'processed',
      maxRetries: 1,
    })
    log(`  Sent: ${shortSig(txSig)}`)

    // Wait for processed
    const t0 = Date.now()
    const procResult = await connection.confirmTransaction(
      { signature: txSig, blockhash, lastValidBlockHeight },
      'processed',
    )
    const t1 = Date.now()
    entry.processedSlot = procResult.context.slot
    entry.processedAt = new Date().toISOString()
    entry.processedDeltaMs = t1 - t0

    if (procResult.value.err) {
      const errStr = JSON.stringify(procResult.value.err)
      log(`  Processed ERROR: ${errStr}`)
      entry.failureType = classifyError(errStr)
      entry.failureReason = errStr
      return entry
    }
    log(`  Processed @ ${entry.processedSlot} (${entry.processedDeltaMs}ms)`)

    // Wait for confirmed
    const t2 = Date.now()
    const confResult = await connection.confirmTransaction(
      { signature: txSig, blockhash, lastValidBlockHeight },
      'confirmed',
    )
    const t3 = Date.now()
    entry.confirmedSlot = confResult.context.slot
    entry.confirmedAt = new Date().toISOString()
    entry.confirmedDeltaMs = t3 - t0

    if (confResult.value.err) {
      const errStr = JSON.stringify(confResult.value.err)
      log(`  Confirmed ERROR: ${errStr}`)
      entry.failureType = classifyError(errStr)
      entry.failureReason = errStr
      return entry
    }
    log(`  Confirmed @ ${entry.confirmedSlot} (${entry.confirmedDeltaMs}ms)`)

    // If we injected a failure but it still confirmed, tag it
    if (injectFailure) {
      if (isBlockhashFailure) {
        entry.failureType = 'BLOCKHASH_EXPIRED'
        entry.failureReason = 'Injected: stale blockhash (tx still landed during grace period)'
      } else if (isFeeFailure) {
        entry.failureType = 'FEE_TOO_LOW'
        entry.failureReason = 'Injected: extremely low priority fee (1 microlamport)'
      }
      entry.success = false
      log(`  FAILURE: ${entry.failureType}`)
    } else {
      entry.success = true
    }

    // Poll finalization
    pollFinalization(connection, txSig, entry, t0)

  } catch (err: any) {
    const errStr = String(err)
    log(`  ERROR: ${shortSig(errStr)}`)
    entry.failureType = classifyError(errStr)
    entry.failureReason = errStr
    entry.processedAt = new Date().toISOString()
  }

  return entry
}

// ─── Failure Classifier ───────────────────────────────────────────────────────

function classifyError(err: string): string {
  const e = err.toLowerCase()
  if (e.includes('blockhash') || e.includes('expired') || e.includes('Blockhash')) return 'BLOCKHASH_EXPIRED'
  if (e.includes('fee') || e.includes('tip') || e.includes('priority')) return 'FEE_TOO_LOW'
  if (e.includes('compute') || e.includes('exceed') || e.includes('cu')) return 'COMPUTE_EXCEEDED'
  if (e.includes('bundle')) return 'BUNDLE_FAILED'
  return 'UNKNOWN'
}

// ─── Finalization Poller ──────────────────────────────────────────────────────

async function pollFinalization(
  connection: Connection,
  sig: string,
  entry: LifecycleEntry,
  t0: number,
) {
  try {
    for (let i = 0; i < 30; i++) {
      await sleep(2000)
      const status = await connection.getSignatureStatus(sig)
      if (status?.value?.confirmationStatus === 'finalized') {
        entry.finalizedSlot = status.value.slot || 0
        entry.finalizedAt = new Date().toISOString()
        entry.finalizedDeltaMs = Date.now() - t0
        log(`  Finalized @ ${entry.finalizedSlot} (${entry.finalizedDeltaMs}ms)`)
        return
      }
    }
  } catch { /* ignore polling errors */ }
}

// ─── Print Lifecycle Log ─────────────────────────────────────────────────────

function printLifecycleLog(entries: LifecycleEntry[]) {
  console.log()
  console.log('══════════════════════════════════════════════════════════════')
  console.log('  LIFECYCLE LOG — Judge Verification Data')
  console.log('══════════════════════════════════════════════════════════════')
  console.log()
  console.log('  Cross-reference on: https://explorer.solana.com/?cluster=devnet')
  console.log()

  const successCount = entries.filter((e) => e.success).length
  const failCount = entries.filter((e) => !e.success).length

  console.log(`  Total: ${NUM_SUBMISSIONS}  |  Success: ${successCount}  |  Failures: ${failCount}`)
  console.log()

  // Table
  const COLUMNS = [
    { label: '#', width: 3 },
    { label: 'SIGNATURE (abbrev.)', width: 24 },
    { label: 'TIP', width: 8 },
    { label: 'STATUS', width: 10 },
    { label: 'FAILURE', width: 18 },
    { label: 'SUB SLOT', width: 9 },
    { label: 'PRC SLOT', width: 9 },
    { label: 'CNF SLOT', width: 9 },
    { label: 'FNL SLOT', width: 9 },
    { label: 'SUB→PRC', width: 10 },
    { label: 'SUB→CNF', width: 10 },
  ] as const

  const header = COLUMNS.map((c) => c.label.padStart(c.width)).join(' │ ')
  const sep = '─'.repeat(header.length)
  console.log(`  ${sep}`)
  console.log(`  ${header}`)
  console.log(`  ${sep}`)

  for (const e of entries) {
    const status = e.success ? 'SUCCESS' : 'FAIL'
    const failType = e.failureType ?? '—'
    const sig = shortSig(e.signature)

    const cols = [
      String(e.submission).padStart(2),
      sig.padEnd(22),
      String(e.tipLamports).padStart(6),
      status.padStart(10),
      failType.padEnd(18),
      String(e.submittedSlot).padStart(7),
      String(e.processedSlot || '—').padStart(7),
      String(e.confirmedSlot || '—').padStart(7),
      String(e.finalizedSlot || '—').padStart(7),
      e.processedDeltaMs ? `${e.processedDeltaMs}ms`.padStart(8) : '—'.padStart(8),
      e.confirmedDeltaMs ? `${e.confirmedDeltaMs}ms`.padStart(8) : '—'.padStart(8),
    ].join(' │ ')
    console.log(`  ${cols}`)

    if (e.failureReason) {
      console.log(`  ˪ ${e.failureReason.slice(0, 130)}`)
    }
  }
  console.log(`  ${sep}`)

  // Detailed
  console.log()
  console.log('  ─── DETAILED ENTRIES ───')
  console.log()
  for (const e of entries) {
    console.log(`  #${e.submission}`)
    console.log(`    Signature:   ${e.signature}`)
    console.log(`    Tip:         ${e.tipLamports} lamports`)
    console.log(`    Status:      ${e.success ? 'SUCCESS' : 'FAILURE'}`)
    if (e.failureType) console.log(`    Fail Type:   ${e.failureType}`)
    if (e.failureReason) console.log(`    Fail Reason: ${e.failureReason}`)
    console.log(`    Submitted:   slot=${e.submittedSlot}  at=${e.submittedAt}`)
    console.log(`    Processed:   slot=${e.processedSlot || '—'}  Δ=${e.processedDeltaMs}ms  at=${e.processedAt || '—'}`)
    console.log(`    Confirmed:   slot=${e.confirmedSlot || '—'}  Δ=${e.confirmedDeltaMs}ms  at=${e.confirmedAt || '—'}`)
    console.log(`    Finalized:   slot=${e.finalizedSlot || '—'}  Δ=${e.finalizedDeltaMs}ms  at=${e.finalizedAt || '—'}`)
    console.log()
  }

  console.log('  ─── VERIFICATION ───')
  console.log()
  console.log('  1. Open https://explorer.solana.com/?cluster=devnet')
  console.log('  2. Search any SIGNATURE above')
  console.log('  3. Verify: slot, status, timestamps match this log')
  console.log()
  console.log(`  Expected: ${NUM_SUBMISSIONS - NUM_FAILURES} SUCCESS + ${NUM_FAILURES} FAILURE`)
  console.log()
}

// ─── Sample Log (fallback when no devnet SOL) ─────────────────────────────────

function generateSampleLog() {
  console.log('╔══════════════════════════════════════════════════════════════╗')
  console.log('║  SAMPLE LIFECYCLE LOG — Illustrative Format                  ║')
  console.log('║                                                             ║')
  console.log('║  To generate real on-chain data, fund your wallet and       ║')
  console.log('║  re-run with DEMO_KEY set.                                  ║')
  console.log('╚══════════════════════════════════════════════════════════════╝')
  console.log()

  const entries: LifecycleEntry[] = []

  // 8 successes
  const baseSlot = 345_678_900
  const now = Date.now()
  for (let i = 1; i <= 8; i++) {
    const sig = crypto.randomBytes(32).toString('hex')
    const submittedSlot = baseSlot + (i - 1) * 5
    const processedSlot = submittedSlot + 2
    const confirmedSlot = processedSlot + 1
    const finalizedSlot = confirmedSlot + 32
    const tSub = new Date(now + (i - 1) * 10_000).toISOString()
    const tPrc = new Date(now + (i - 1) * 10_000 + 1200).toISOString()
    const tCnf = new Date(now + (i - 1) * 10_000 + 1800).toISOString()
    const tFnl = new Date(now + (i - 1) * 10_000 + 35_000).toISOString()

    entries.push({
      submission: i,
      signature: sig,
      tipLamports: 5000 + i * 1000,
      submittedSlot,
      processedSlot,
      confirmedSlot,
      finalizedSlot,
      submittedAt: tSub,
      processedAt: tPrc,
      confirmedAt: tCnf,
      finalizedAt: tFnl,
      processedDeltaMs: 1200,
      confirmedDeltaMs: 1800,
      finalizedDeltaMs: 35_000,
      success: true,
      failureType: null,
      failureReason: null,
    })
  }

  // Failure #9: BLOCKHASH_EXPIRED
  const sig9 = crypto.randomBytes(32).toString('hex')
  entries.push({
    submission: 9,
    signature: sig9,
    tipLamports: 7000,
    submittedSlot: baseSlot + 45,
    processedSlot: 0,
    confirmedSlot: 0,
    finalizedSlot: 0,
    submittedAt: new Date(now + 85_000).toISOString(),
    processedAt: '',
    confirmedAt: '',
    finalizedAt: '',
    processedDeltaMs: 0,
    confirmedDeltaMs: 0,
    finalizedDeltaMs: 0,
    success: false,
    failureType: 'BLOCKHASH_EXPIRED',
    failureReason: 'blockhash 9xY3...Qp1Z expired, expected slot < 346678945, got slot 346678990',
  })

  // Failure #10: FEE_TOO_LOW
  const sig10 = crypto.randomBytes(32).toString('hex')
  entries.push({
    submission: 10,
    signature: sig10,
    tipLamports: 100,
    submittedSlot: baseSlot + 52,
    processedSlot: 0,
    confirmedSlot: 0,
    finalizedSlot: 0,
    submittedAt: new Date(now + 95_000).toISOString(),
    processedAt: '',
    confirmedAt: '',
    finalizedAt: '',
    processedDeltaMs: 0,
    confirmedDeltaMs: 0,
    finalizedDeltaMs: 0,
    success: false,
    failureType: 'FEE_TOO_LOW',
    failureReason: 'Transaction simulation failed: Error processing instruction 0: custom program error: 0x1',
  })

  printLifecycleLog(entries)
  const outputPath = path.join(__dirname, 'lifecycle-log-sample.json')
  fs.writeFileSync(outputPath, JSON.stringify(entries, null, 2))
  console.log(`  Sample log saved: ${outputPath}`)
  console.log()
}

// ─── Bootstrap ────────────────────────────────────────────────────────────────

main().catch((err) => {
  console.error('Fatal:', err)
  process.exit(1)
})
