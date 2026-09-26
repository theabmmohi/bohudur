import type { BohudurOptions, CreateRequest, CreateResponse } from "@type/index"
import { Request } from "@bohudur/http"

const path: string = "/create/v2/"

interface CreateResponseWire {
  paymentkey: string
  payment_url: string
}

export default async function create(key: string, options: BohudurOptions, request: CreateRequest): Promise<CreateResponse> {
  const data = await Request<CreateResponseWire>(key, options, path, {
    full_name: request.name,
    email: request.email,
    amount: request.amount,
    return_type: request.returnType,
    redirect_url: request.redirectURL,
    cancel_url: request.cancelURL,
    metadata: request.metadata,
    webhook: request.webhook
  })
  return {
    paykey: data.paymentkey,
    paymentURL: data.payment_url
  }
}
