// ===========================================
// Current User Decorator
// Extracts user from request for use in handlers
// ===========================================

import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { TokenPayload } from '@infrastructure/security/jwt.service';

export const CurrentUser = createParamDecorator(
    (data: keyof TokenPayload | undefined, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest<Request>();
        const user = (request as any).user as TokenPayload;

        if (!user) {
            return null;
        }

        return data ? user[data] : user;
    },
);
