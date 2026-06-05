import express from 'express'
import cors from 'cors'
import { config, logger } from '@stack/shared'
import { Orchestrator } from './orchestrator'
import { getFirestore, TransactionRepository, FailureRepository, DecisionRepository, BundleRepository, SlotRepository } from '@stack/shared'

const app = express()
app.use(cors())
app.use(express.json())

const orchestrator = new Orchestrator()
const db = getFirestore()
const txRepo = new TransactionRepository(db)
const failureRepo = new FailureRepository(db)
const decisionRepo = new DecisionRepository(db)
const bundleRepo = new BundleRepository(db)
const slotRepo = new SlotRepository(db)

app.get('/api/status', (_req, res) => {
  res.json(orchestrator.getStatus())
})

app.get('/api/transactions', async (_req, res) => {
  const txs = await txRepo.getAll(100)
  res.json(txs)
})

app.get('/api/failures', async (_req, res) => {
  const failures = await failureRepo.getAll(100)
  res.json(failures)
})

app.get('/api/decisions', async (_req, res) => {
  const decisions = await decisionRepo.getAll(100)
  res.json(decisions)
})

app.get('/api/bundles', async (_req, res) => {
  const bundles = await bundleRepo.getAll(100)
  res.json(bundles)
})

app.get('/api/slots', async (_req, res) => {
  const slots = await slotRepo.getAll(100)
  res.json(slots)
})

app.post('/api/fault-inject/blockhash-expiry', async (_req, res) => {
  try {
    await orchestrator.testFaultInjection()
    res.json({ success: true, message: 'Blockhash expiry fault injection completed' })
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) })
  }
})

app.get('/api/metrics', async (_req, res) => {
  const txs = await txRepo.getAll(1000)
  const failures = await failureRepo.getAll(1000)

  const totalTx = txs.length
  const failedTx = failures.length
  const successRate = totalTx > 0 ? (totalTx - failedTx) / totalTx : 0

  const confirmedTxs = txs.filter((t) => t.confirmedDeltaMs > 0)
  const finalizedTxs = txs.filter((t) => t.finalizedDeltaMs > 0)

  const avgConfirmationLatency = confirmedTxs.length > 0
    ? confirmedTxs.reduce((sum, t) => sum + t.confirmedDeltaMs, 0) / confirmedTxs.length
    : 0

  const avgFinalizationLatency = finalizedTxs.length > 0
    ? finalizedTxs.reduce((sum, t) => sum + t.finalizedDeltaMs, 0) / finalizedTxs.length
    : 0

  res.json({
    totalTransactions: totalTx,
    totalFailures: failedTx,
    successRate,
    averageConfirmationLatencyMs: Math.round(avgConfirmationLatency),
    averageFinalizationLatencyMs: Math.round(avgFinalizationLatency),
    currentSlot: orchestrator.getStatus().currentSlot,
    health: orchestrator.getStatus().health,
  })
})

const PORT = 3001

async function main() {
  try {
    await orchestrator.start()
    app.listen(PORT, () => {
      logger.info('Orchestrator API running', { port: PORT })
    })
  } catch (error) {
    logger.error('Failed to start orchestrator', { error: String(error) })
    process.exit(1)
  }
}

process.on('SIGINT', () => {
  orchestrator.stop()
  process.exit(0)
})

process.on('SIGTERM', () => {
  orchestrator.stop()
  process.exit(0)
})

main()
