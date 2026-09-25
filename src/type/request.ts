export interface CreateRequest {
  name: string
  email: string
  amount: number
  returnType: "GET" | "POST"
  redirectUrl: string
  cancelUrl: string
  metadata?: Record<string, unknown>
  webhook?: {
    success?: string
    cancel?: string
  }
}

export interface QueryRequest {
  paykey: string
}

export interface ExecuteRequest {
  paykey: string
}
