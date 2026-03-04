export class ValidateTokenCommand {
  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly isActive: boolean,
    public readonly roles: string[],
    public readonly apps: string[],
  ) {}
}
