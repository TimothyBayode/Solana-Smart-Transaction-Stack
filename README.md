# Solana Smart Transaction Stack

A production-grade Solana transaction execution and observability platform with AI-driven operational decisions.

## System Overview

The Smart Transaction Stack monitors Solana in real time, detects leader schedules, constructs Jito bundles, dynamically determines bundle tips, tracks transaction lifecycle progression, handles failures intelligently, and uses an AI agent to make operational decisions. All telemetry and decision data is persisted to Firestore.

## Architecture

The system is composed of 10 microservices plus a dashboard:

| Service | Responsibility |
|---------|---------------|
| **Slot Observer** | Consumes Yellowstone/Geyser streams and RPC slot notifications |
| **Leader Detector** | Tracks current/next leaders and Jito leader windows |
| **Tip Engine** | Dynamically calculates bundle tips from network conditions |
| **AI Agent** | Makes operational decisions using OpenAI |
| **Transaction Builder** | Constructs signed Versioned Transactions |
| **Bundle Builder** | Creates and submits Jito bundles |
| **Lifecycle Tracker** | Tracks submitted → processed → confirmed → finalized |
| **Failure Classifier** | Categorizes failures (blockhash, compute, fee, bundle) |
| **Recovery Engine** | AI-driven automatic recovery from failures |
| **Orchestrator** | API server coordinating all services |

See `architecture.md` for detailed component and data flow diagrams.

## Setup

### Prerequisites

- Node.js 20+
- npm 9+
- Firebase project with Firestore
- OpenAI API key
- Solana RPC endpoint
- Jito block engine URL (optional for mainnet)

### Installation

```bash
git clone <repo>
cd solana-smart-transaction-stack
npm install
```

### Environment Variables

Copy `.env.example` to `.env` and fill in:

```env
# Required
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-client-email
FIREBASE_PRIVATE_KEY=your-private-key
OPENAI_API_KEY=your-openai-api-key

# Optional
SOLANA_WS_URL=wss://api.mainnet-beta.solana.com
JITO_BLOCK_ENGINE_URL=https://mainnet.block-engine.jito.wtf
YELLOWSTONE_GRPC_URL=your-grpc-endpoint
YELLOWSTONE_GRPC_TOKEN=your-grpc-token
```

### Running

```bash
# Build all services
npm run build

# Start the orchestrator (includes all services)
npm run dev

# Start the dashboard (separate terminal)
npm run dev --workspace=dashboard
```

Orchestrator API: http://localhost:3001
Dashboard: http://localhost:3000

## How AI Decisions Work

1. **Context Collection**: The orchestrator collects current slot, tip statistics, leader info, network load, and success rates.
2. **Agent Invocation**: The AI Agent sends the context as a structured JSON prompt to OpenAI.
3. **Reasoning**: OpenAI analyzes the data and returns a decision with reasoning and confidence score.
4. **Persistence**: Every decision is stored in the `agent_decisions` Firestore collection.
5. **Execution**: The orchestrator executes the AI's decision (SUBMIT, RETRY, INCREASE_TIP, WAIT, ESCALATE, RECOVER).

Example agent context:

```json
{
  "networkLoad": 0.82,
  "medianTip": 15000,
  "p90Tip": 30000,
  "recentSuccessRate": 0.6,
  "currentSlot": 283940201,
  "currentLeader": "Duf92ZN4kFWkQ2cUfshZ3sWfJPcGJjprG6K4XTGFPiyA"
}
```

Example agent response:

```json
{
  "decision": "INCREASE_TIP",
  "reasoning": "Success rate is 60% which is below the 70% threshold. Network load is high at 0.82. Increasing tip from median (15000) toward P90 (30000) to improve landing probability.",
  "confidence": 0.85
}
```

## Failure Handling

1. **Detection**: The Lifecycle Tracker detects failures via signature subscriptions.
2. **Classification**: The Failure Classifier categorizes the error.
3. **AI Review**: The AI Agent evaluates the failure context and decides a recovery strategy.
4. **Recovery**: The Recovery Engine executes the AI's strategy.

Failure types and their recovery:

| Failure Type | Cause | AI Recovery Action |
|-------------|-------|-------------------|
| BLOCKHASH_EXPIRED | Blockhash older than 150 slots | Fetch fresh blockhash, rebuild |
| COMPUTE_EXCEEDED | Transaction exceeds compute budget | Increase compute units |
| FEE_TOO_LOW | Priority fee insufficient | Increase tip via Tip Engine |
| BUNDLE_FAILED | Jito bundle rejected | Restructure and resubmit |
| UNKNOWN | Unrecognized error | Escalate to manual review |

## Lifecycle Tracking

Each transaction passes through four states:

```
Submitted → Processed → Confirmed → Finalized
```

- **Submitted**: Transaction/bundle sent to network
- **Processed**: Leader included transaction in a block
- **Confirmed**: Block received supermajority vote (confirmation level 1)
- **Finalized**: Block reached maximum lockout (confirmation level max)

Latency deltas are calculated between each state transition:

```
processedDeltaMs = processedAt - submittedAt
confirmedDeltaMs = confirmedAt - submittedAt
finalizedDeltaMs = finalizedAt - submittedAt
```

## Fault Injection

The system includes a test mode to verify failure recovery:

```bash
POST /api/fault-inject/blockhash-expiry
```

This:
1. Fetches a valid blockhash
2. Waits 150 seconds for it to expire
3. Submits the expired transaction
4. Detects the BLOCKHASH_EXPIRED failure
5. Triggers the AI recovery flow

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/status` | GET | System health and current slot |
| `/api/metrics` | GET | Aggregate dashboard metrics |
| `/api/transactions` | GET | Transaction lifecycle records |
| `/api/failures` | GET | Failure classification records |
| `/api/decisions` | GET | AI agent decision history |
| `/api/bundles` | GET | Bundle submission history |
| `/api/slots` | GET | Slot observation history |
| `/api/fault-inject/blockhash-expiry` | POST | Trigger fault injection test |

## Collections (Firestore)

- `transactions` - Lifecycle records
- `failures` - Failure classification records
- `agent_decisions` - AI agent decisions with reasoning
- `tip_decisions` - Tip recommendation history
- `slot_metrics` - Slot observation data
- `bundle_submissions` - Bundle submission records

## Observations

### Question 1: What does processed-to-confirmed latency indicate?

Processed-to-confirmed latency measures the time between a transaction being included in a block (processed) and that block receiving enough validator votes to reach confirmation (super majority ~2/3 of stake). This latency reflects network propagation speed, validator consensus efficiency, and potential network congestion. High processed-to-confirmed latency can indicate:

- Poor network connectivity between validators
- High block propagation delays
- Validator software inefficiencies
- Network congestion or attacks

It is distinct from submission latency because it isolates the consensus phase from the mempool/leader selection phase.

### Question 2: Why should finalized commitment never be used when fetching a blockhash?

Finalized commitment means the block has reached maximum lockout (approximately 32 blocks deep), which takes 30-60 seconds. By the time you fetch a blockhash at finalized commitment, many slots have passed, and the blockhash you receive is already near expiration. Since blockhashes are valid for only 150 slots (~75 seconds at 400ms slots), using finalized commitment gives you almost no time to build and submit a transaction before the blockhash expires. Always use `confirmed` commitment when fetching blockhashes, as this gives you the maximum time window for transaction building and submission.

### Question 3: What happens when a Jito leader skips a slot?

When a Jito (or any) leader skips their assigned slot:

1. **Bundle queue is flushed**: Any bundles pending for that leader's slot are not processed and must be resubmitted.
2. **Slot is empty**: No block is produced for that slot, meaning no transactions are included.
3. **Next leader takes over**: The schedule continues with the next validator in the leader schedule.
4. **Bundle re-submission required**: Bundles targeted at the skipped slot's block engine endpoint will fail and must be rebuilt for the next available leader.
5. **Latency impact**: For Jito bundles specifically, a skipped leader means the bundle must wait for the next Jito-enabled leader in the schedule, potentially adding 1-2 epochs of delay.
6. **Tip loss**: Any tip included in the bundle is not consumed (no block was produced), but the computational work of building the bundle is wasted.

The system detects skipped slots via the Slot Observer and the AI Agent factors this into decisions about when to submit bundles and whether to increase tips for priority.
