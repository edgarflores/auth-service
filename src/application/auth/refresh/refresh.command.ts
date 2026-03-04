export class RefreshCommand {
  constructor(
    public readonly userId: string,
    public readonly refreshToken: string,
  ) {}
}
