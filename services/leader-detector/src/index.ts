import { LeaderDetector } from './leader-detector'

const detector = new LeaderDetector()

export async function getCurrentLeader() {
  return detector.getCurrentLeader()
}

export async function getNextLeader() {
  const leaders = await detector.getNextLeaders(1)
  return leaders[0] || null
}

export async function getLeaderWindow() {
  return detector.getLeaderWindow()
}

async function main() {
  await detector.start()
  const window = await detector.getLeaderWindow()
  console.log('Leader window:', JSON.stringify(window, null, 2))
}

if (require.main === module) {
  main().catch(console.error)
}
