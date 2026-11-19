import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { QuerySimDto } from './query-sim.dto';

describe('SIM code query filters', () => {
  it.each(['code-1', ['code-1', 'code-2']])(
    'accepts a single code or repeated code parameters: %s',
    async (simCode) => {
      const dto = plainToInstance(QuerySimDto, { simCode });
      expect(await validate(dto)).toEqual([]);
      expect(dto.simCode).toEqual(Array.isArray(simCode) ? simCode : [simCode]);
    },
  );

  it('rejects non-string code values rather than coercing them', async () => {
    const dto = plainToInstance(QuerySimDto, { simCode: ['code-1', 42] });
    expect(await validate(dto)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ property: 'simCode' }),
      ]),
    );
  });
});
