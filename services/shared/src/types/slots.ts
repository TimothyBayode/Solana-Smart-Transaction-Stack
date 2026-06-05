export interface SlotMetric {
  slot: number
  leader: string
  timestamp: string
}

export interface LeaderInfo {
  slot: number
  leader: string
  estimatedTime: string
}

export interface LeaderWindow {
  currentSlot: number
  currentLeader: string
  upcomingLeaders: LeaderInfo[]
  nextJitoLeader: LeaderInfo | null
}
