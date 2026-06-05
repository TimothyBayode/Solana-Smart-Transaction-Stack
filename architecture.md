# Smart Transaction Stack - Architecture

## High-Level Architecture

```mermaid
graph TB
    subgraph "Solana Network"
        SOL[Solana Validators]
        JITO[Jito Block Engine]
        YELLOW[Yellowstone/Geyser]
    end

    subgraph "Monitoring Layer"
        SO[Slot Observer]
        LD[Leader Detector]
    end

    subgraph "Execution Layer"
        TB[Transaction Builder]
        BB[Bundle Builder]
    end

    subgraph "AI Layer"
        TE[Tip Engine]
        AI[AI Agent]
    end

    subgraph "Persistence Layer"
        FS[Firestore]
        LR[Logger]
    end

    subgraph "Recovery Layer"
        FC[Failure Classifier]
        RE[Recovery Engine]
    end

    subgraph "UI Layer"
        DASH[Dashboard]
    end

    SOL --> SO
    SOL --> LD
    YELLOW --> SO
    JITO --> BB

    SO --> LD
    LD --> TE
    TE --> AI
    AI --> TB
    TB --> BB
    BB --> JITO

    SO --> FS
    LD --> FS
    TE --> FS
    AI --> FS
    BB --> FS
    FC --> FS

    BB --> FC
    FC --> RE
    RE --> TB

    DASH --> FS
    RE --> LR
    ALL --> LR
```

## Component Diagram

```mermaid
graph LR
    subgraph "Services"
        SO[Slot Observer<br/>port: internal]
        LD[Leader Detector<br/>port: internal]
        TE[Tip Engine<br/>port: internal]
        AI[AI Agent<br/>port: internal]
        TB[Transaction Builder<br/>port: internal]
        BB[Bundle Builder<br/>port: internal]
        LT[Lifecycle Tracker<br/>port: internal]
        FC[Failure Classifier<br/>port: internal]
        RE[Recovery Engine<br/>port: internal]
    end

    subgraph "API Layer"
        ORCH[Orchestrator<br/>port: 3001]
    end

    subgraph "Database"
        FS[(Firestore<br/>Collections)]
    end

    ORCH --> SO
    ORCH --> LD
    ORCH --> TE
    ORCH --> AI
    ORCH --> TB
    ORCH --> BB
    ORCH --> LT
    ORCH --> FC
    ORCH --> RE

    SO --> FS
    LD --> FS
    TE --> FS
    AI --> FS
    BB --> FS
    LT --> FS
    FC --> FS

    subgraph "Dashboard"
        WEB[Next.js<br/>port: 3000]
    end

    WEB --> ORCH
```

## Data Flow Diagram

```mermaid
sequenceDiagram
    participant S as Solana
    participant SO as Slot Observer
    participant LD as Leader Detector
    participant TE as Tip Engine
    participant AI as AI Agent
    participant TB as Transaction Builder
    participant BB as Bundle Builder
    participant FS as Firestore
    participant D as Dashboard

    S->>SO: Slot update
    SO->>FS: Save slot metric
    SO->>LD: Current slot

    LD->>S: Get leader schedule
    LD->>FS: Save leader info

    TE->>S: Get tip account data
    TE->>FS: Save tip recommendation
    TE->>AI: Tip context

    AI->>AI: Reason about state
    AI->>FS: Save decision
    AI->>TB: Build transaction

    TB->>S: Get blockhash
    TB->>BB: Bundle transactions

    BB->>S: Submit bundle
    BB->>FS: Save bundle record

    S->>LT: Transaction status
    LT->>FS: Update lifecycle

    alt Failure Detected
        LT->>FC: Classify failure
        FC->>FS: Save failure
        FC->>RE: Trigger recovery
        RE->>AI: Get recovery strategy
        AI->>RE: Recovery plan
        RE->>TB: Rebuild transaction
        RE->>FS: Mark recovered
    end

    D->>FS: Query metrics
    D->>D: Display dashboard
```

## Failure Handling Flow

```mermaid
stateDiagram-v2
    [*] --> Submitted: Bundle Submitted
    Submitted --> Processed: Transaction processed
    Submitted --> Failure: Error detected
    Processed --> Confirmed: Block confirmed
    Processed --> Failure: Error detected
    Confirmed --> Finalized: Block finalized
    Confirmed --> Failure: Error detected

    Failure --> Classified: Classify failure type
    Classified --> AIReview: AI agent review
    AIReview --> RecoveryPlan: AI decides action

    RecoveryPlan --> BlockhashExpired: BLOCKHASH_EXPIRED
    RecoveryPlan --> ComputeExceeded: COMPUTE_EXCEEDED
    RecoveryPlan --> FeeTooLow: FEE_TOO_LOW
    RecoveryPlan --> BundleFailed: BUNDLE_FAILED
    RecoveryPlan --> Escalated: UNKNOWN

    BlockhashExpired --> Rebuilding: Fetch fresh blockhash
    ComputeExceeded --> Rebuilding: Increase compute budget
    FeeTooLow --> Rebuilding: Increase tip
    BundleFailed --> Rebuilding: Restructure bundle
    Escalated --> [*]: Manual review

    Rebuilding --> Resubmitted: Rebuilt
    Resubmitted --> Submitted: Resubmitted to network
```

## AI Decision Flow

```mermaid
flowchart TD
    START([Context Available]) --> COLLECT{Collect Data}

    COLLECT --> NET[Network Load]
    COLLECT --> TIP[Tip Statistics]
    COLLECT --> SUCCESS[Success Rate]
    COLLECT --> SLOT[Current Slot]
    COLLECT --> LEADER[Current Leader]

    NET --> AI[AI Agent]
    TIP --> AI
    SUCCESS --> AI
    SLOT --> AI
    LEADER --> AI

    AI --> REASON{Reasoning Engine}
    REASON --> DECIDE{Make Decision}

    DECIDE --> SUBMIT[SUBMIT<br/>Submit bundle now]
    DECIDE --> RETRY[RETRY<br/>Retry with changes]
    DECIDE --> INCREASE[INCREASE_TIP<br/>Raise tip amount]
    DECIDE --> WAIT[WAIT<br/>Wait for conditions]
    DECIDE --> ESCALATE[ESCALATE<br/>Manual review needed]
    DECIDE --> RECOVER[RECOVER<br/>Attempt recovery]

    SUBMIT --> CONF[Confidence Score]
    RETRY --> CONF
    INCREASE --> CONF
    WAIT --> CONF
    ESCALATE --> CONF
    RECOVER --> CONF

    CONF --> STORE[Store in Firestore]
    STORE --> EXECUTE{Execute Decision}
    EXECUTE --> LOG[Log Outcome]
    LOG --> END([End])
```

## Firestore Collections

```mermaid
erDiagram
    transactions {
        string signature PK
        string status
        string submittedAt
        string processedAt
        string confirmedAt
        string finalizedAt
        int submittedSlot
        int processedSlot
        int confirmedSlot
        int finalizedSlot
        int processedDeltaMs
        int confirmedDeltaMs
        int finalizedDeltaMs
        int tip
        string error
    }

    failures {
        string id PK
        string signature
        string failureType
        string reason
        int slot
        string timestamp
        bool recovered
        string recoveryAction
    }

    agent_decisions {
        string id PK
        string decision
        string reasoning
        float confidence
        map context
        string timestamp
    }

    tip_decisions {
        string id PK
        int medianTip
        int averageTip
        int p90Tip
        int recommendedTip
        float landingSuccessRate
        int slot
        string timestamp
    }

    slot_metrics {
        int slot PK
        string leader
        string timestamp
    }

    bundle_submissions {
        string id PK
        string bundleId
        int slot
        int tip
        list signatures
        string submittedAt
        bool landed
        int landedSlot
    }
```

## Service Dependencies

| Service | Depends On | Provides |
|---------|------------|----------|
| Slot Observer | Solana RPC, Yellowstone gRPC | Real-time slot updates |
| Leader Detector | Slot Observer | Current/next leader info |
| Tip Engine | Solana RPC | Dynamic tip recommendations |
| AI Agent | Tip Engine, Firestore | Operational decisions |
| Transaction Builder | AI Agent | Signed transactions |
| Bundle Builder | Transaction Builder | Jito bundles |
| Lifecycle Tracker | Solana RPC/WS | Transaction state tracking |
| Failure Classifier | Lifecycle Tracker | Failure categorization |
| Recovery Engine | Failure Classifier, AI Agent | Automated recovery |
| Orchestrator | All Services | API, coordination |
| Dashboard | Orchestrator API | UI visualization |
