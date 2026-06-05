import { Commitment } from '@solana/web3.js'

function requireEnv(key: string): string {
  const value = process.env[key]
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`)
  }
  return value
}

function optionalEnv(key: string, defaultValue: string = ''): string {
  return process.env[key] || defaultValue
}

export const config = {
  solana: {
    rpcUrl: requireEnv('SOLANA_RPC_URL'),
    wsUrl: requireEnv('SOLANA_WS_URL'),
    commitment: (optionalEnv('SOLANA_COMMITMENT', 'confirmed') || 'confirmed') as Commitment,
  },
  jito: {
    blockEngineUrl: requireEnv('JITO_BLOCK_ENGINE_URL'),
    tipAccount: optionalEnv('JITO_TIP_ACCOUNT', '96gYZGDn1bYYYQ2mcXUjiT4tNwjHGQKTPPJDFTnZNcv7'),
    authKeypair: optionalEnv('JITO_AUTH_KEYPAIR'),
  },
  yellowstone: {
    grpcUrl: optionalEnv('YELLOWSTONE_GRPC_URL'),
    grpcToken: optionalEnv('YELLOWSTONE_GRPC_TOKEN'),
  },
  firebase: {
    projectId: requireEnv('FIREBASE_PROJECT_ID'),
    clientEmail: requireEnv('FIREBASE_CLIENT_EMAIL'),
    privateKey: requireEnv('FIREBASE_PRIVATE_KEY'),
  },
  openai: {
    apiKey: requireEnv('OPENAI_API_KEY'),
    model: optionalEnv('OPENAI_MODEL', 'gpt-4'),
  },
  dashboard: {
    apiUrl: optionalEnv('NEXT_PUBLIC_API_URL', 'http://localhost:3001'),
  },
  general: {
    nodeEnv: optionalEnv('NODE_ENV', 'development'),
    logLevel: optionalEnv('LOG_LEVEL', 'info'),
  },
}
