// ===========================================
// Student Controller
// Handles student result endpoints
// ===========================================

import {
    Controller,
    Get,
    Param,
    UseGuards,
    ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { StudentService } from './student.service';
import { JwtAuthGuard } from '@presentation/guards/jwt-auth.guard';
import { CurrentUser } from '@presentation/decorators/current-user.decorator';
import { TokenPayload } from '@infrastructure/security/jwt.service';

@ApiTags('students')
@Controller({
    path: 'student',
    version: '1',
})
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class StudentController {
    constructor(private readonly studentService: StudentService) { }

    @Get('profile')
    @ApiOperation({ summary: 'Get current student profile' })
    @ApiResponse({ status: 200, description: 'Student profile returned' })
    async getProfile(@CurrentUser() user: TokenPayload) {
        return this.studentService.getProfile(user.sub);
    }

    @Get('results')
    @ApiOperation({ summary: 'Get all student results' })
    @ApiResponse({ status: 200, description: 'All results returned' })
    async getAllResults(@CurrentUser() user: TokenPayload) {
        return this.studentService.getAllResults(user.sub);
    }

    @Get('results/semester/:semesterId')
    @ApiOperation({ summary: 'Get student results for a specific semester' })
    @ApiResponse({ status: 200, description: 'Semester results returned' })
    async getSemesterResults(
        @CurrentUser() user: TokenPayload,
        @Param('semesterId', ParseUUIDPipe) semesterId: string,
    ) {
        return this.studentService.getSemesterResults(user.sub, semesterId);
    }

    @Get('gpa')
    @ApiOperation({ summary: 'Get student GPA summary' })
    @ApiResponse({ status: 200, description: 'GPA summary returned' })
    async getGPASummary(@CurrentUser() user: TokenPayload) {
        return this.studentService.getGPASummary(user.sub);
    }

    @Get('transcript')
    @ApiOperation({ summary: 'Get full academic transcript' })
    @ApiResponse({ status: 200, description: 'Full transcript returned' })
    async getTranscript(@CurrentUser() user: TokenPayload) {
        return this.studentService.getTranscript(user.sub);
    }
}
