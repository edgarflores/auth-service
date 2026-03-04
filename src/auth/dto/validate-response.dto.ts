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

  @ApiProperty({
    example: ['user'],
    description: 'Roles asignados al usuario',
    type: [String],
  })
  roles: string[];

  @ApiProperty({
    example: ['ledgerflow'],
    description: 'Apps a las que el usuario tiene acceso',
    type: [String],
  })
  apps: string[];
}
