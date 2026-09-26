import type { BohudurOptions, CreateRequest, ExecuteRequest, QueryRequest, WebhookPayload } from "@type/index"
import create from "@bohudur/create"
import execute from "@bohudur/execute"
import query from "@bohudur/query"
import verifyWebhook from "@bohudur/verifyWebhook"

export default class Bohudur {
  constructor(
    private readonly key: string,
    private readonly options: BohudurOptions = {}
  ) {}
  create(request: CreateRequest) {
    return create(this.key, this.options, request)
  }
  execute(request: ExecuteRequest) {
    return execute(this.key, this.options, request)
  }
  query(request: QueryRequest) {
    return query(this.key, this.options, request)
  }
  verifyWebhook(payload: WebhookPayload) {
    return verifyWebhook(this.key, this.options, payload)
  }
}
