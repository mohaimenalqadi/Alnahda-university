// ===========================================
// API Client
// ===========================================

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface ApiError {
    statusCode: number;
    message: string;
    error: string;
}

class ApiClient {
    private baseUrl: string;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
    }

    private isRefreshing = false;
    private refreshFailed = false;
    private lastRefreshStatus: number | null = null;
    private refreshQueue: Array<(success: boolean) => void> = [];

    /**
     * Reset authentication state - call this when user logs in
     */
    public resetAuthState() {
        this.refreshFailed = false;
        this.isRefreshing = false;
        this.refreshQueue = [];
    }

    private processQueue(success: boolean) {
        this.refreshQueue.forEach((callback) => callback(success));
        this.refreshQueue = [];
    }

    private async request<T>(
        endpoint: string,
        options: RequestInit = {},
        _isRetry = false
    ): Promise<T> {
        // If we know refresh failed previously, don't even try and just throw 401
        if (this.refreshFailed && !endpoint.includes('/login') && !endpoint.includes('/refresh')) {
            throw new ApiRequestError('Session expired', 401, 'Unauthorized');
        }

        const url = `${this.baseUrl}${endpoint}`;

        // 1. Get tokens from localStorage for Header Fallback
        const accessToken = typeof window !== 'undefined' ? localStorage.getItem('student_access_token') : null;
        const isAdmin = endpoint.includes('/admin') || endpoint.includes('admin/');

        const config: RequestInit = {
            ...options,
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-Token': '1',
                // iOS Fix: If we have a token and it's not an admin request, use the header
                ...(accessToken && !isAdmin ? { 'Authorization': `Bearer ${accessToken}` } : {}),
                ...options.headers,
            },
        };

        try {
            const response = await fetch(url, config);

            // Handle 401 and attempt refresh
            if (response.status === 401 && !_isRetry && !endpoint.includes('/refresh') && !endpoint.includes('/login')) {
                // If already refreshing, join the queue
                if (this.isRefreshing) {
                    return new Promise((resolve, reject) => {
                        this.refreshQueue.push((success) => {
                            if (success) {
                                resolve(this.request(endpoint, options, true));
                            } else {
                                reject(new ApiRequestError('Unauthorized', 401, 'Unauthorized'));
                            }
                        });
                    });
                }

                this.isRefreshing = true;
                const isAdmin = endpoint.includes('/admin') || endpoint.includes('admin/');
                const refreshPath = isAdmin
                    ? '/api/v1/auth/admin/refresh'
                    : '/api/v1/auth/student/refresh';

                try {
                    const result = await this.refreshTokenByPath(refreshPath);
                    this.isRefreshing = false;
                    this.lastRefreshStatus = result.status;

                    if (result.success) {
                        this.refreshFailed = false;
                        this.processQueue(true);
                        return this.request(endpoint, options, true);
                    } else {
                        // Only "brick" the client if the refresh token itself is invalid (401/403)
                        // Otherwise (e.g. 500 or network error), allow subsequent retries
                        if (result.status === 401 || result.status === 403) {
                            this.refreshFailed = true;
                            // Clean up tokens on absolute failure
                            if (typeof window !== 'undefined') {
                                localStorage.removeItem('student_access_token');
                                localStorage.removeItem('student_refresh_token');
                                localStorage.removeItem('student_session_active');
                            }
                            // Trigger global redirect if we're in a browser
                            if (typeof window !== 'undefined') {
                                const event = new CustomEvent('auth-unauthorized', {
                                    detail: { isAdmin, path: window.location.pathname }
                                });
                                window.dispatchEvent(event);
                            }
                        }
                        this.processQueue(false);
                    }
                } catch (error) {
                    this.isRefreshing = false;
                    // Don't set refreshFailed = true on network errors
                    this.processQueue(false);
                }
            }


            // Reset failure state on successful login
            if (response.ok && endpoint.includes('/login')) {
                this.resetAuthState();
            }

            if (!response.ok) {
                const errorData: ApiError = await response.json().catch(() => ({
                    statusCode: response.status,
                    message: 'An error occurred',
                    error: response.statusText,
                }));

                throw new ApiRequestError(
                    errorData.message,
                    errorData.statusCode,
                    errorData.error
                );
            }

            return response.json();
        } catch (error) {
            if (error instanceof ApiRequestError) throw error;
            throw new ApiRequestError('Network error', 0, 'NetworkError');
        }
    }

    private async refreshTokenByPath(path: string): Promise<{ success: boolean; status: number }> {
        console.warn(`[AUTH] Attempting silent token refresh at: ${path}`);
        try {
            const response = await fetch(`${this.baseUrl}${path}`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': '1',
                },
            });

            if (response.ok) {
                console.log(`[AUTH] Refresh successful for ${path}`);
                return { success: true, status: response.status };
            } else {
                console.error(`[AUTH] Refresh failed with status ${response.status} for ${path}`);
                return { success: false, status: response.status };
            }
        } catch (error: any) {
            console.error(`[AUTH] Refresh network error for ${path}:`, error.message);
            return { success: false, status: 0 };
        }
    }

    // Auth endpoints
    async studentLogin(data: { registrationNumber: string; dateOfBirth: string }) {
        const result = await this.request<{
            success: boolean;
            message: string;
            student: {
                id: string;
                fullNameAr: string;
                fullNameEn: string;
                registrationNumberPrefix: string;
                departmentNameAr: string;
                departmentNameEn: string;
            };
            accessToken: string;
            refreshToken: string;
            expiresIn: number;
        }>('/api/v1/auth/student/login', {
            method: 'POST',
            body: JSON.stringify(data),
        });

        // iOS Fix: Store tokens in localStorage as a fallback to cookies
        if (result.success && typeof window !== 'undefined') {
            localStorage.setItem('student_access_token', result.accessToken);
            localStorage.setItem('student_refresh_token', result.refreshToken);
            localStorage.setItem('student_session_active', 'true');
        }

        return result;
    }

    async studentLogout() {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('student_access_token');
            localStorage.removeItem('student_refresh_token');
            localStorage.removeItem('student_session_active');
        }
        return this.request<{ success: boolean }>('/api/v1/auth/student/logout', {
            method: 'POST',
        });
    }

    async adminLogin(data: { email: string; password: string }) {
        return this.request<{
            success: boolean;
            message: string;
            requireMfa?: boolean;
            mfaToken?: string;
            admin?: {
                id: string;
                email: string;
                fullName: string;
            };
            expiresIn?: number;
        }>('/api/v1/auth/admin/login', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async verifyMfa(data: { mfaToken: string; code: string }) {
        return this.request<{
            success: boolean;
            message: string;
            admin: {
                id: string;
                email: string;
                fullName: string;
            };
            expiresIn: number;
        }>('/api/v1/auth/admin/mfa/verify', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async adminLogout() {
        return this.request<{ success: boolean }>('/api/v1/auth/admin/logout', {
            method: 'POST',
        });
    }

    async getAdminStats() {
        return this.request<{
            students: { total: number; active: number };
            courses: number;
            enrollments: number;
            grades: { pending: number; published: number };
            activeSemester: { id: string; nameAr: string; nameEn: string } | null;
        }>('/api/v1/admin/dashboard/stats');
    }

    async getAuditLogs(params?: {
        page?: number;
        limit?: number;
        action?: string;
        adminUserId?: string;
    }) {
        const query = new URLSearchParams();
        if (params?.page) query.append('page', params.page.toString());
        if (params?.limit) query.append('limit', params.limit.toString());
        if (params?.action) query.append('action', params.action);
        if (params?.adminUserId) query.append('adminUserId', params.adminUserId);

        return this.request<{
            data: any[];
            pagination: {
                page: number;
                limit: number;
                total: number;
                totalPages: number;
            };
        }>(`/api/v1/admin/audit-logs?${query.toString()}`);
    }

    async getAdminStudents(params?: {
        page?: number;
        limit?: number;
        search?: string;
        departmentId?: string;
        semesterLevel?: number;
        status?: string;
    }) {
        const query = new URLSearchParams();
        if (params?.page) query.append('page', params.page.toString());
        if (params?.limit) query.append('limit', params.limit.toString());
        if (params?.search) query.append('search', params.search);
        if (params?.departmentId) query.append('departmentId', params.departmentId);
        if (params?.semesterLevel) query.append('semesterLevel', params.semesterLevel.toString());
        if (params?.status) query.append('status', params.status);

        return this.request<{
            data: Array<{
                id: string;
                fullNameAr: string;
                fullNameEn: string;
                registrationNumber: string;
                email: string;
                status: string;
                academicYear: number;
                department: {
                    code: string;
                    nameAr: string;
                    nameEn: string;
                };
            }>;
            pagination: {
                page: number;
                limit: number;
                total: number;
                totalPages: number;
            };
        }>(`/api/v1/admin/students?${query.toString()}`);
    }

    async getAdminStudentDetails(id: string) {
        return this.request<any>(`/api/v1/admin/students/${id}`);
    }

    async getStudentAcademicResults(studentId: string, semesterId?: string) {
        const query = semesterId ? `?semesterId=${semesterId}` : '';
        return this.request<any[]>(`/api/v1/admin/students/${studentId}/results${query}`);
    }

    async getAdminGrades(params?: {
        semesterId?: string;
        courseId?: string;
        departmentId?: string;
        semesterLevel?: number;
        isPublished?: boolean;
    }) {
        const query = new URLSearchParams();
        if (params?.semesterId) query.append('semesterId', params.semesterId);
        if (params?.courseId) query.append('courseId', params.courseId);
        if (params?.departmentId) query.append('departmentId', params.departmentId);
        if (params?.semesterLevel) query.append('semesterLevel', params.semesterLevel.toString());
        if (params?.isPublished !== undefined) query.append('isPublished', params.isPublished.toString());

        return this.request<any[]>(`/api/v1/admin/grades?${query.toString()}`);
    }

    async createStudent(data: any) {
        return this.request<any>('/api/v1/admin/students', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async updateStudent(id: string, data: any) {
        return this.request<any>(`/api/v1/admin/students/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
    }

    async deleteStudent(id: string) {
        return this.request<any>(`/api/v1/admin/students/${id}`, {
            method: 'DELETE',
        });
    }

    async createSemester(data: any) {
        return this.request<any>('/api/v1/admin/semesters', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async updateSemester(id: string, data: any) {
        return this.request<any>(`/api/v1/admin/semesters/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
    }

    async createDepartment(data: any) {
        return this.request<any>('/api/v1/admin/departments', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async updateDepartment(id: string, data: any) {
        return this.request<any>(`/api/v1/admin/departments/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
    }

    async getAdminDepartments() {
        return this.request<any[]>('/api/v1/admin/departments');
    }

    async createGrade(data: {
        enrollmentId: string;
        courseworkScore: number;
        finalExamScore: number;
    }) {
        return this.request<any>('/api/v1/admin/grades', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async updateGrade(id: string, data: {
        courseworkScore?: number;
        finalExamScore?: number;
    }) {
        return this.request<any>(`/api/v1/admin/grades/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
    }

    async publishGrades(data: { semesterId: string; studentId?: string }) {
        return this.request<any>('/api/v1/admin/grades/publish', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async getAdminSemesters() {
        return this.request<any[]>('/api/v1/admin/semesters');
    }
    async getAdminCourses(departmentId?: string, semesterLevel?: number) {
        const query = new URLSearchParams();
        if (departmentId) query.append('departmentId', departmentId);
        if (semesterLevel) query.append('semesterLevel', semesterLevel.toString());
        return this.request<any[]>(`/api/v1/admin/courses?${query.toString()}`);
    }

    async deleteEnrollment(id: string) {
        return this.request<any>(`/api/v1/admin/enrollments/${id}`, {
            method: 'DELETE',
        });
    }

    async createCourse(data: any) {
        return this.request<any>('/api/v1/admin/courses', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async updateCourse(id: string, data: any) {
        return this.request<any>(`/api/v1/admin/courses/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
    }

    async refreshToken() {
        return this.request<{ success: boolean; expiresIn: number }>(
            '/api/v1/auth/student/refresh',
            { method: 'POST' }
        );
    }

    async adminRefreshToken() {
        return this.request<{ success: boolean; expiresIn: number }>(
            '/api/v1/auth/admin/refresh',
            { method: 'POST' }
        );
    }

    // Student endpoints
    async getProfile() {
        return this.request<{
            id: string;
            fullNameAr: string;
            fullNameEn: string;
            registrationNumber: string;
            email: string;
            academicYear: number;
            semesterLevel: number;
            status: string;
            department: {
                code: string;
                nameAr: string;
                nameEn: string;
            };
        }>('/api/v1/student/profile');
    }

    async getAllResults() {
        return this.request<SemesterResult[]>('/api/v1/student/results');
    }

    async getGPASummary() {
        return this.request<{
            cumulativeGPA: number;
            totalCreditsEarned: number;
            classification: string;
            classificationAr: string;
            semesterGPAs: Array<{
                semester: string;
                year: number;
                term: string;
                gpa: number;
                credits: number;
            }>;
        }>('/api/v1/student/gpa');
    }

    async getTranscript() {
        return this.request<{
            student: any;
            academicRecord: SemesterResult[];
            summary: {
                cumulativeGPA: number;
                totalCredits: number;
                classification: string;
                classificationAr: string;
            };
            generatedAt: string;
        }>('/api/v1/student/transcript');
    }
}

// Error class
export class ApiRequestError extends Error {
    statusCode: number;
    error: string;

    constructor(message: string, statusCode: number, error: string) {
        super(message);
        this.statusCode = statusCode;
        this.error = error;
        this.name = 'ApiRequestError';
    }
}

// Types
export interface CourseResult {
    courseCode: string;
    courseNameAr: string;
    courseNameEn: string;
    units: number;
    courseworkScore: number;
    finalExamScore: number;
    totalScore: number;
    letterGrade: string;
    letterGradeAr: string;
    gradePoints: number;
    passed: boolean;
}

export interface SemesterResult {
    semesterId: string;
    semesterNameAr: string;
    semesterNameEn: string;
    year: number;
    term: string;
    courses: CourseResult[];
    semesterGPA: number;
    totalCredits: number;
    levelNameAr?: string;
    currentLevel?: number;
    summary?: {
        totalUnits: number;
        completedUnits: number;
        passedUnits: number;
        incompleteCourses: number;
        gpa: number;
        classificationAr: string;
        statusAr: string;
    };
}

// Export singleton instance
export const api = new ApiClient(API_BASE_URL);
