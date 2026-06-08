import { SlotObserver } from './slot-observer'

export { SlotObserver }

const observer = new SlotObserver()

async function main(): Promise<void> {
  try {
    await observer.start()
    console.log('Slot Observer running')
  } catch (error) {
    console.error('Slot Observer failed to start', error)
    process.exit(1)
  }
}

process.on('SIGINT', () => {
  observer.stop()
  process.exit(0)
})

process.on('SIGTERM', () => {
  observer.stop()
  process.exit(0)
})

main()
