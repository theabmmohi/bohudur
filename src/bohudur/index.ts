import type { BohudurOptions, CreateRequest, QueryRequest, ExecuteRequest, CreateResponse, QueryResponse, ExecuteResponse } from "@type/index"
import { request } from "@bohudur/http"
import { parseBohudurDate } from "@bohudur/wire"
import type { CreateRequestWire, CreateResponseWire, QueryOrExecuteResponseWire } from "@bohudur/wire"

function toCreateRequestWire(req: CreateRequest): CreateRequestWire {
  return {
    full_name: req.name,
    email: req.email,
    amount: req.amount,
    return_type: req.returnType,
    redirect_url: req.redirectUrl,
    cancel_url: req.cancelUrl,
    metadata: req.metadata,
    webhook: req.webhook
  }
}

function fromCreateResponseWire(wire: CreateResponseWire): CreateResponse {
  return {
    paykey: wire.paymentkey,
    paymentUrl: wire.payment_url
  }
}

function fromQueryOrExecuteWire(wire: QueryOrExecuteResponseWire): QueryResponse {
  return {
    paykey: wire.paymentkey,
    status: wire.status,
    name: wire.full_name,
    email: wire.email,
    amount: wire.amount,
    convertedAmount: wire.converted_amount,
    totalAmount: wire.total_amount,
    createdAt: parseBohudurDate(wire.created_time) as Date,
    paidAt: parseBohudurDate(wire.payment_time),
    receipt: wire.receipt === "NONE" ? null : wire.receipt,
    metadata: Array.isArray(wire.metadata) ? null : wire.metadata,
    paymentInfo: wire.payment_info
  }
}

export class Bohudur {
  constructor(
    private readonly key: string,
    private readonly options: BohudurOptions = {}
  ) {}

  async create(req: CreateRequest): Promise<CreateResponse> {
    const wire = await request<CreateResponseWire>(this.key, this.options, "/create/v2/", toCreateRequestWire(req))
    return fromCreateResponseWire(wire)
  }

  async query(req: QueryRequest): Promise<QueryResponse> {
    const wire = await request<QueryOrExecuteResponseWire>(this.key, this.options, "/query/v2/", { paymentkey: req.paykey })
    return fromQueryOrExecuteWire(wire)
  }

  async execute(req: ExecuteRequest): Promise<ExecuteResponse> {
    const wire = await request<QueryOrExecuteResponseWire>(this.key, this.options, "/execute/v2/", { paymentkey: req.paykey })
    return fromQueryOrExecuteWire(wire)
  }

  async verifyWebhook(webhookBody: { paymentkey: string }): Promise<QueryResponse> {
    return this.query({ paykey: webhookBody.paymentkey })
  }
}
