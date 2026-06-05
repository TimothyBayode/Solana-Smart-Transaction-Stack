import { TipEngine } from './tip-engine'

const tipEngine = new TipEngine()

export async function getTipRecommendation() {
  return tipEngine.recommendTip()
}

export { TipEngine }
