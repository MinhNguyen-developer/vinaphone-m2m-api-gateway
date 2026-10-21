import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { LoginDto } from './login.dto';

describe('LoginDto', () => {
  it('trims and lowercases the Vinaphone email before validation', async () => {
    const dto = plainToInstance(LoginDto, {
      email: ' Account@Example.com ',
      password: 'secret',
    });

    expect(dto.email).toBe('account@example.com');
    await expect(validate(dto)).resolves.toHaveLength(0);
  });
});
