import { ApiProperty } from '@nestjs/swagger';

export class ValidateResponseDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'ID del usuario',
  })
  userId: string;

  @ApiProperty({
    example: 'user@example.com',
    description: 'Email del usuario',
  })
  email: string;

  @ApiProperty({
    example: true,
    description: 'Indica si el usuario está activo',
  })
  isActive: boolean;
}
