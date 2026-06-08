import { Connection, Keypair, LAMPORTS_PER_SOL } from '@solana/web3.js'
async function main() {
  const kp = Keypair.generate()
  const c = new Connection('https://api.devnet.solana.com', 'confirmed')
  console.log(`New wallet: ${kp.publicKey.toBase58()}`)
  for (let i = 0; i < 10; i++) {
    try {
      const sig = await c.requestAirdrop(kp.publicKey, 2 * LAMPORTS_PER_SOL)
      console.log(`Airdrop OK: ${sig}`)
      await c.confirmTransaction(sig, 'confirmed')
      const bal = await c.getBalance(kp.publicKey)
      console.log(`Balance: ${bal / LAMPORTS_PER_SOL} SOL`)
      const b64 = Buffer.from(kp.secretKey).toString('base64')
      console.log(`\nDEMO_KEY=${b64}\n`)
      return
    } catch(e: any) {
      const msg = String(e).slice(0, 120)
      console.log(`Attempt ${i+1}: ${msg}`)
    }
    await new Promise(r => setTimeout(r, 5000))
  }
  console.log('Failed after 10 attempts.')
}
main()
