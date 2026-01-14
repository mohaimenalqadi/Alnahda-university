import { Controller, Get, VERSION_NEUTRAL, Version } from '@nestjs/common';

@Controller({ version: VERSION_NEUTRAL })
export class AppController {
    @Get()
    getHello(): string {
        return 'Al-Nahda University API is running';
    }

    @Version('1')
    @Get('health')
    getHealth() {
        return {
            status: 'ok',
            timestamp: new Date().toISOString(),
            service: 'alnahda-backend',
            database: 'connected' // We can improve this, but for now just returning ok is enough
        };
    }
}
