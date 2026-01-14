// ===========================================
// GPA Calculator Unit Tests
// ===========================================

import { GPACalculatorService, GradeInput, GradeResult } from './gpa-calculator.service';

describe('GPACalculatorService', () => {
    let service: GPACalculatorService;

    beforeEach(() => {
        service = new GPACalculatorService();
    });

    describe('calculateGrade', () => {
        it('should calculate Excellent grade correctly', () => {
            const input: GradeInput = {
                courseworkScore: 38,
                finalExamScore: 52,
                units: 4,
            };

            const result = service.calculateGrade(input);

            expect(result.totalScore).toBe(90);
            expect(result.letterGrade).toBe('Excellent');
            expect(result.gradePoints).toBe(4.0);
            expect(result.weightedPoints).toBe(16);
            expect(result.passed).toBe(true);
        });

        it('should calculate Good grade correctly', () => {
            const input: GradeInput = {
                courseworkScore: 28,
                finalExamScore: 42,
                units: 4,
            };

            const result = service.calculateGrade(input);

            expect(result.totalScore).toBe(70);
            expect(result.letterGrade).toBe('Good');
            expect(result.gradePoints).toBe(2.0);
            expect(result.weightedPoints).toBe(8);
            expect(result.passed).toBe(true);
        });

        it('should calculate failing grade correctly', () => {
            const input: GradeInput = {
                courseworkScore: 15,
                finalExamScore: 25,
                units: 3,
            };

            const result = service.calculateGrade(input);

            expect(result.totalScore).toBe(40);
            expect(result.letterGrade).toBe('Fail');
            expect(result.gradePoints).toBe(0);
            expect(result.weightedPoints).toBe(0);
            expect(result.passed).toBe(false);
        });

        it('should handle boundary cases correctly', () => {
            // Test exact passing score
            const passingInput: GradeInput = {
                courseworkScore: 20,
                finalExamScore: 30,
                units: 2,
            };
            const passingResult = service.calculateGrade(passingInput);
            expect(passingResult.totalScore).toBe(50);
            expect(passingResult.letterGrade).toBe('Pass');
            expect(passingResult.passed).toBe(true);

            // Test just below passing
            const failingInput: GradeInput = {
                courseworkScore: 19,
                finalExamScore: 30,
                units: 2,
            };
            const failingResult = service.calculateGrade(failingInput);
            expect(failingResult.totalScore).toBe(49);
            expect(failingResult.letterGrade).toBe('Fail');
            expect(failingResult.passed).toBe(false);
        });

        it('should throw error for invalid coursework score', () => {
            const input: GradeInput = {
                courseworkScore: 50, // Exceeds max of 40
                finalExamScore: 50,
                units: 3,
            };

            expect(() => service.calculateGrade(input)).toThrow();
        });

        it('should throw error for negative scores', () => {
            const input: GradeInput = {
                courseworkScore: -5,
                finalExamScore: 50,
                units: 3,
            };

            expect(() => service.calculateGrade(input)).toThrow();
        });
    });

    describe('calculateGPA', () => {
        it('should calculate semester GPA correctly', () => {
            const grades: GradeResult[] = [
                { totalScore: 85, letterGrade: 'Excellent', gradePoints: 4.0, weightedPoints: 12.0, passed: true },
                { totalScore: 75, letterGrade: 'Very Good', gradePoints: 3.0, weightedPoints: 9.0, passed: true },
                { totalScore: 65, letterGrade: 'Good', gradePoints: 2.0, weightedPoints: 8.0, passed: true },
            ];
            const units = [3, 3, 4];

            const result = service.calculateGPA(grades, units);

            // Total weighted: 12 + 9 + 8 = 29
            // Total units: 10
            // GPA = 2.9
            expect(result.gpa).toBe(2.9);
            expect(result.totalCredits).toBe(10);
            expect(result.classificationAr).toBe('جيد جداً');
        });

        it('should return zero GPA for empty grades', () => {
            const result = service.calculateGPA([], []);

            expect(result.gpa).toBe(0);
            expect(result.totalCredits).toBe(0);
            expect(result.classification).toBe('N/A');
        });

        it('should calculate GPA for single course', () => {
            const grades: GradeResult[] = [
                { totalScore: 90, letterGrade: 'Excellent', gradePoints: 4.0, weightedPoints: 16, passed: true },
            ];
            const units = [4];

            const result = service.calculateGPA(grades, units);

            expect(result.gpa).toBe(4.0);
            expect(result.totalCredits).toBe(4);
            expect(result.classificationAr).toBe('ممتاز');
        });

        it('should throw error for mismatched arrays', () => {
            const grades: GradeResult[] = [
                { totalScore: 90, letterGrade: 'A', gradePoints: 3.75, weightedPoints: 15, passed: true },
            ];
            const units = [4, 3]; // Different length

            expect(() => service.calculateGPA(grades, units)).toThrow();
        });
    });

    describe('calculateSemesterGPA', () => {
        it('should calculate semester GPA from raw grade inputs', () => {
            const grades = [
                { courseworkScore: 35, finalExamScore: 50, units: 3 },  // 85 - B+
                { courseworkScore: 38, finalExamScore: 55, units: 3 },  // 93 - A
                { courseworkScore: 32, finalExamScore: 45, units: 4 },  // 77 - C+
            ];

            const result = service.calculateSemesterGPA(grades);

            expect(result.totalCredits).toBe(10);
            expect(result.gpa).toBeGreaterThan(0);
            expect(result.classification).toBeDefined();
        });
    });

    describe('getGradeFromScore', () => {
        it('should return correct grades for all score ranges', () => {
            expect(service.getGradeFromScore(100)).toEqual({ letter: 'Excellent', points: 4.0 });
            expect(service.getGradeFromScore(85)).toEqual({ letter: 'Excellent', points: 4.0 });
            expect(service.getGradeFromScore(80)).toEqual({ letter: 'Very Good', points: 3.0 });
            expect(service.getGradeFromScore(75)).toEqual({ letter: 'Very Good', points: 3.0 });
            expect(service.getGradeFromScore(70)).toEqual({ letter: 'Good', points: 2.0 });
            expect(service.getGradeFromScore(65)).toEqual({ letter: 'Good', points: 2.0 });
            expect(service.getGradeFromScore(60)).toEqual({ letter: 'Pass', points: 1.0 });
            expect(service.getGradeFromScore(50)).toEqual({ letter: 'Pass', points: 1.0 });
            expect(service.getGradeFromScore(49)).toEqual({ letter: 'Fail', points: 0.0 });
            expect(service.getGradeFromScore(0)).toEqual({ letter: 'Fail', points: 0.0 });
        });
    });

    describe('getClassificationFromScore', () => {
        it('should return correct classifications for Score ranges', () => {
            expect(service.getClassificationFromScore(90).nameAr).toBe('ممتاز');
            expect(service.getClassificationFromScore(80).nameAr).toBe('جيد جداً');
            expect(service.getClassificationFromScore(70).nameAr).toBe('جيد');
            expect(service.getClassificationFromScore(60).nameAr).toBe('مقبول');
            expect(service.getClassificationFromScore(40).nameAr).toBe('راسب');
        });
    });

    describe('precision and determinism', () => {
        it('should produce deterministic results for floating-point calculations', () => {
            const input: GradeInput = {
                courseworkScore: 33.33,
                finalExamScore: 49.99,
                units: 3,
            };

            const result1 = service.calculateGrade(input);
            const result2 = service.calculateGrade(input);

            expect(result1.totalScore).toBe(result2.totalScore);
            expect(result1.gradePoints).toBe(result2.gradePoints);
            expect(result1.weightedPoints).toBe(result2.weightedPoints);
        });

        it('should round to 2 decimal places consistently', () => {
            const grades = [
                { totalScore: 83.333, letterGrade: 'B', gradePoints: 3.0, weightedPoints: 9, passed: true },
                { totalScore: 77.777, letterGrade: 'C+', gradePoints: 2.5, weightedPoints: 7.5, passed: true },
            ];
            const units = [3, 3];

            const result = service.calculateGPA(grades, units);

            // Ensure GPA is rounded to 2 decimal places
            expect(result.gpa.toString().split('.')[1]?.length ?? 0).toBeLessThanOrEqual(2);
        });
    });
});
