export class BohudurError extends Error {
  constructor(
    message: string,
    readonly code: number,
    readonly type: "api" | "network" | "server" | "validation"
  ) {
    super(message)
    this.name = "BohudurError"
  }
}
