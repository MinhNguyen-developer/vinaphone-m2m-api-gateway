import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { runWithTenant } from '../prisma/tenant-context';

@Injectable()
export class TenantContextInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<{
      user?: { accountId?: string };
    }>();
    const accountId = request.user?.accountId;
    if (!accountId) return next.handle();

    return new Observable((subscriber) =>
      runWithTenant(accountId, () => next.handle().subscribe(subscriber)),
    );
  }
}
