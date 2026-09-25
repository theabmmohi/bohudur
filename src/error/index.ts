export type BohudurErrorKind = "api" | "network" | "validation"

export class BohudurError extends Error {
  constructor(
    message: string,
    readonly code: number,
    readonly kind: BohudurErrorKind = "api"
  ) {
    super(message)
    this.name = "BohudurError"
  }
}
