import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/index.js';
import { getCurrentAccountId } from './tenant-context';
import { isTenantModel, scopeTenantArgs } from './tenant-scope';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    const adapter = new PrismaPg(process.env.DATABASE_URL as string);
    super({ adapter });

    const tenantClient = this.$extends({
      query: {
        $allModels: {
          $allOperations({ model, args, query }) {
            if (!isTenantModel(model)) return query(args);
            return query(scopeTenantArgs(args, getCurrentAccountId()));
          },
        },
      },
    });

    return new Proxy(this, {
      get(target, property, receiver) {
        const extendedValue = Reflect.get(tenantClient, property, tenantClient);
        if (extendedValue !== undefined) {
          return typeof extendedValue === 'function'
            ? extendedValue.bind(tenantClient)
            : extendedValue;
        }
        return Reflect.get(target, property, receiver);
      },
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}

