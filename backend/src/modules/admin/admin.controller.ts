// ===========================================
// Admin Controller
// Handles admin management endpoints
// ===========================================

import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
    ParseUUIDPipe,
    HttpCode,
    HttpStatus,
    BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '@presentation/guards/jwt-auth.guard';
import { RolesGuard } from '@presentation/guards/roles.guard';
import { Roles } from '@presentation/decorators/roles.decorator';
import { CurrentUser } from '@presentation/decorators/current-user.decorator';
import { TokenPayload } from '@infrastructure/security/jwt.service';
import { CreateGradeDto, UpdateGradeDto, PublishGradesDto } from './dto/grade.dto';
import { CreateStudentDto, UpdateStudentDto } from './dto/student.dto';
import { CreateSemesterDto, UpdateSemesterDto } from './dto/semester.dto';
import { CreateDepartmentDto, UpdateDepartmentDto } from './dto/department.dto';
import { CreateCourseDto, UpdateCourseDto } from './dto/course.dto';

@ApiTags('admin')
@Controller({
    path: 'admin',
    version: '1',
})
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AdminController {
    constructor(private readonly adminService: AdminService) { }

    // ===========================================
    // Dashboard
    // ===========================================

    @Get('dashboard/stats')
    @Roles('ADMIN', 'SUPER_ADMIN')
    @ApiOperation({ summary: 'Get dashboard statistics' })
    @ApiResponse({ status: 200, description: 'Dashboard stats returned' })
    async getDashboardStats() {
        return this.adminService.getDashboardStats();
    }

    // ===========================================
    // Student Management
    // ===========================================

    @Get('students')
    @Roles('ADMIN', 'SUPER_ADMIN', 'VIEWER')
    @ApiOperation({ summary: 'List all students with pagination' })
    @ApiResponse({ status: 200, description: 'Students list returned' })
    async listStudents(
        @Query('page') page: number = 1,
        @Query('limit') limit: number = 20,
        @Query('search') search?: string,
        @Query('departmentId') departmentId?: string,
        @Query('status') status?: string,
    ) {
        return this.adminService.listStudents({
            page,
            limit,
            search,
            departmentId,
            status,
        });
    }

    @Get('students/:id/results')
    @Roles('ADMIN', 'SUPER_ADMIN', 'VIEWER')
    @ApiOperation({ summary: 'Get student academic results' })
    async getStudentResults(@Param('id', ParseUUIDPipe) id: string, @Query('semesterId') semesterId?: string) {
        return this.adminService.getStudentResults(id, semesterId);
    }

    @Get('students/:id')
    @Roles('ADMIN', 'SUPER_ADMIN', 'VIEWER')
    @ApiOperation({ summary: 'Get student details' })
    @ApiResponse({ status: 200, description: 'Student details returned' })
    async getStudent(@Param('id', ParseUUIDPipe) id: string) {
        return this.adminService.getStudentDetails(id);
    }

    @Post('students')
    @Roles('ADMIN', 'SUPER_ADMIN')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Create a new student' })
    async createStudent(@Body() dto: CreateStudentDto, @CurrentUser() user: TokenPayload) {
        return this.adminService.createStudent(dto, user.sub);
    }

    @Patch('students/:id')
    @Roles('ADMIN', 'SUPER_ADMIN')
    @ApiOperation({ summary: 'Update student details' })
    async updateStudent(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateStudentDto, @CurrentUser() user: TokenPayload) {
        return this.adminService.updateStudent(id, dto, user.sub);
    }

    @Delete('students/:id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @Roles('SUPER_ADMIN', 'ADMIN')
    @ApiOperation({ summary: 'Delete a student' })
    async deleteStudent(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: TokenPayload) {
        return this.adminService.deleteStudent(id, user.sub);
    }

    // ===========================================
    // Grade Management
    // ===========================================

    @Get('grades')
    @Roles('ADMIN', 'SUPER_ADMIN', 'VIEWER')
    @ApiOperation({ summary: 'List grades with filtering' })
    @ApiResponse({ status: 200, description: 'Grades list returned' })
    async listGrades(
        @Query('semesterId') semesterId?: string,
        @Query('courseId') courseId?: string,
        @Query('departmentId') departmentId?: string,
        @Query('semesterLevel') semesterLevel?: number,
        @Query('isPublished') isPublished?: boolean,
    ) {
        return this.adminService.listGrades({ semesterId, courseId, departmentId, semesterLevel, isPublished });
    }

    @Post('grades')
    @Roles('ADMIN', 'SUPER_ADMIN')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Create a new grade' })
    @ApiResponse({ status: 201, description: 'Grade created' })
    async createGrade(
        @Body() dto: CreateGradeDto,
        @CurrentUser() user: TokenPayload,
    ) {
        if (!user || !user.sub) {
            throw new BadRequestException('شخصية المستخدم غير متوفرة. يرجى إعادة تسجيل الدخول.');
        }

        try {
            return await this.adminService.createGrade(dto, user.sub);
        } catch (error: any) {
            console.error(`[CRITICAL] AdminController.createGrade Error for user ${user.sub}:`, error);
            if (error.stack) console.error(error.stack);
            throw error;
        }
    }

    @Patch('grades/:id')
    @Roles('ADMIN', 'SUPER_ADMIN')
    @ApiOperation({ summary: 'Update a grade' })
    @ApiResponse({ status: 200, description: 'Grade updated' })
    async updateGrade(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: UpdateGradeDto,
        @CurrentUser() user: TokenPayload,
    ) {
        return this.adminService.updateGrade(id, dto, user.sub);
    }

    @Post('grades/publish')
    @Roles('ADMIN', 'SUPER_ADMIN')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Publish grades for a semester' })
    @ApiResponse({ status: 200, description: 'Grades published' })
    async publishGrades(
        @Body() dto: PublishGradesDto,
        @CurrentUser() user: TokenPayload,
    ) {
        return this.adminService.publishGrades(dto, user.sub);
    }

    @Delete('enrollments/:id')
    @Roles('ADMIN', 'SUPER_ADMIN')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Delete a student enrollment and its associated grade' })
    async deleteEnrollment(
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentUser() user: TokenPayload,
    ) {
        return this.adminService.deleteEnrollment(id, user.sub);
    }

    // ===========================================
    // Semester Management
    // ===========================================

    @Get('semesters')
    @Roles('ADMIN', 'SUPER_ADMIN', 'VIEWER')
    @ApiOperation({ summary: 'List all semesters' })
    @ApiResponse({ status: 200, description: 'Semesters list returned' })
    async listSemesters() {
        return this.adminService.listSemesters();
    }

    @Post('semesters')
    @Roles('ADMIN', 'SUPER_ADMIN')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Create a new semester' })
    async createSemester(@Body() dto: CreateSemesterDto, @CurrentUser() user: TokenPayload) {
        return this.adminService.createSemester(dto, user.sub);
    }

    @Patch('semesters/:id')
    @Roles('ADMIN', 'SUPER_ADMIN')
    @ApiOperation({ summary: 'Update a semester' })
    async updateSemester(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateSemesterDto, @CurrentUser() user: TokenPayload) {
        return this.adminService.updateSemester(id, dto, user.sub);
    }

    // ===========================================
    // Course Management
    // ===========================================

    @Get('courses')
    @Roles('ADMIN', 'SUPER_ADMIN', 'VIEWER')
    @ApiOperation({ summary: 'List all courses' })
    @ApiResponse({ status: 200, description: 'Courses list returned' })
    async listCourses(
        @Query('departmentId') departmentId?: string,
        @Query('semesterLevel') semesterLevel?: number
    ) {
        return this.adminService.listCourses(departmentId, semesterLevel);
    }

    @Post('courses')
    @Roles('ADMIN', 'SUPER_ADMIN')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Create a new course' })
    async createCourse(@Body() dto: CreateCourseDto, @CurrentUser() user: TokenPayload) {
        return this.adminService.createCourse(dto, user.sub);
    }

    @Patch('courses/:id')
    @Roles('ADMIN', 'SUPER_ADMIN')
    @ApiOperation({ summary: 'Update a course' })
    async updateCourse(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: UpdateCourseDto,
        @CurrentUser() user: TokenPayload
    ) {
        return this.adminService.updateCourse(id, dto, user.sub);
    }

    @Get('departments')
    @Roles('ADMIN', 'SUPER_ADMIN', 'VIEWER')
    @ApiOperation({ summary: 'List all departments' })
    async listDepartments() {
        return this.adminService.listDepartments();
    }

    @Post('departments')
    @Roles('ADMIN', 'SUPER_ADMIN')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Create a new department' })
    async createDepartment(@Body() dto: CreateDepartmentDto, @CurrentUser() user: TokenPayload) {
        return this.adminService.createDepartment(dto, user.sub);
    }

    @Delete('departments/:id')
    @Roles('ADMIN', 'SUPER_ADMIN')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Delete a department' })
    async deleteDepartment(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: TokenPayload) {
        return this.adminService.deleteDepartment(id, user.sub);
    }

    @Delete('courses/:id')
    @Roles('ADMIN', 'SUPER_ADMIN')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Delete a course' })
    async deleteCourse(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: TokenPayload) {
        return this.adminService.deleteCourse(id, user.sub);
    }

    // ===========================================
    // Audit Logs
    // ===========================================

    @Get('audit-logs')
    @Roles('SUPER_ADMIN')
    @ApiOperation({ summary: 'View audit logs' })
    @ApiResponse({ status: 200, description: 'Audit logs returned' })
    async getAuditLogs(
        @Query('page') page: number = 1,
        @Query('limit') limit: number = 50,
        @Query('action') action?: string,
        @Query('adminUserId') adminUserId?: string,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
    ) {
        return this.adminService.getAuditLogs({
            page,
            limit,
            action,
            adminUserId,
            startDate,
            endDate,
        });
    }
}
