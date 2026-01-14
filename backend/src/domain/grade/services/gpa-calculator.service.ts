// ===========================================
// GPA Calculator Domain Service
// Core Academic Business Logic
// ===========================================

import { Injectable } from '@nestjs/common';

export interface GradeInput {
    courseworkScore: number;
    finalExamScore: number;
    units: number;
    maxCoursework?: number;
    maxFinalExam?: number;
}

export interface GradeResult {
    totalScore: number;
    letterGrade: string;
    gradePoints: number;
    weightedPoints: number;
    passed: boolean;
}

export interface GPAResult {
    gpa: number;
    totalCredits: number;
    totalWeightedPoints: number;
    classification: string;
    classificationAr: string;
}

export interface GradeScale {
    min: number;
    max: number;
    letter: string;
    letterAr: string;
    points: number;
}

/**
 * GPA Calculator Domain Service
 * 
 * This service encapsulates all academic calculation logic following
 * Domain-Driven Design principles. It is pure business logic with no
 * dependencies on infrastructure or presentation layers.
 * 
 * Calculation Rules:
 * - Total Score = Coursework + Final Exam
 * - Grade Points are assigned based on the grading scale
 * - Weighted Points = Grade Points × Course Units
 * - GPA = Σ(Weighted Points) / Σ(Units)
 */
@Injectable()
export class GPACalculatorService {
    // Simplified Grading Scale as requested
    private readonly gradeScale: GradeScale[] = [
        { min: 85, max: 100, letter: 'ممتاز', points: 4.00, letterAr: 'ممتاز' },
        { min: 75, max: 84.99, letter: 'جيد جداً', points: 3.00, letterAr: 'جيد جداً' },
        { min: 65, max: 74.99, letter: 'جيد', points: 2.00, letterAr: 'جيد' },
        { min: 50, max: 64.99, letter: 'مقبول', points: 1.00, letterAr: 'مقبول' },
        { min: 35, max: 49.99, letter: 'ضعيف', points: 0.00, letterAr: 'ضعيف' },
        { min: 0, max: 34.99, letter: 'ضعيف جداً', points: 0.00, letterAr: 'ضعيف جداً' },
    ];

    // Academic classifications based on average score
    private readonly classifications = [
        { minScore: 85, nameAr: 'ممتاز' },
        { minScore: 75, nameAr: 'جيد جداً' },
        { minScore: 65, nameAr: 'جيد' },
        { minScore: 50, nameAr: 'مقبول' },
        { minScore: 0, nameAr: 'راسب' },
    ];

    private readonly PASSING_SCORE = 50;

    /**
     * Calculate grade details for a single course
     */
    calculateGrade(input: GradeInput): GradeResult {
        const { courseworkScore, finalExamScore, units } = input;

        // Validate inputs
        this.validateScores(input);

        // Calculate total score
        const totalScore = this.roundToDecimal(courseworkScore + finalExamScore, 2);

        // Get letter grade and points
        const { letter: letterGrade, points: gradePoints } = this.getGradeFromScore(totalScore);

        // Calculate weighted points
        const weightedPoints = this.roundToDecimal(gradePoints * units, 2);

        // Determine if passed
        const passed = totalScore >= this.PASSING_SCORE;

        return {
            totalScore,
            letterGrade,
            gradePoints,
            weightedPoints,
            passed,
        };
    }

    /**
     * Calculate GPA from multiple grades using specialized Al-Nahda formula:
     * GPA = Σ(TotalScore * Units) / Σ(Passed Units)
     * For passed courses only. Precision: 4 decimal places.
     */
    calculateGPA(grades: GradeResult[], units: number[]): GPAResult {
        if (grades.length !== units.length) {
            throw new Error('Grades and units arrays must have the same length');
        }

        if (grades.length === 0) {
            return {
                gpa: 0,
                totalCredits: 0,
                totalWeightedPoints: 0,
                classification: 'N/A',
                classificationAr: 'غير متاح',
            };
        }

        // Filter for passed grades only
        let totalWeightedScore = 0;
        let totalPassedUnits = 0;

        for (let i = 0; i < grades.length; i++) {
            if (grades[i].passed) {
                totalWeightedScore += grades[i].totalScore * units[i];
                totalPassedUnits += units[i];
            }
        }

        // Calculate GPA with 4 decimal precision
        const gpa = totalPassedUnits > 0
            ? this.roundToDecimal(totalWeightedScore / totalPassedUnits, 4)
            : 0;

        // Get classification using avg score
        const { nameAr: classificationAr } = this.getClassificationFromScore(gpa);

        return {
            gpa,
            totalCredits: totalPassedUnits, // In this context, totalCredits refers to total passed units used in calculation
            totalWeightedPoints: this.roundToDecimal(totalWeightedScore, 4),
            classification: 'N/A',
            classificationAr,
        };
    }

    /**
     * Calculate Average Score (Arithmetic Mean)
     */
    calculateAverageScore(scores: number[]): number {
        if (scores.length === 0) return 0;
        const sum = scores.reduce((a, b) => a + b, 0);
        return this.roundToDecimal(sum / scores.length, 2);
    }

    /**
     * Calculate semester GPA
     */
    calculateSemesterGPA(
        grades: Array<{
            courseworkScore: number;
            finalExamScore: number;
            units: number;
        }>,
    ): GPAResult {
        const gradeResults: GradeResult[] = [];
        const units: number[] = [];

        for (const grade of grades) {
            const result = this.calculateGrade(grade);
            gradeResults.push(result);
            units.push(grade.units);
        }

        return this.calculateGPA(gradeResults, units);
    }

    /**
     * Get letter grade and points from a score
     */
    getGradeFromScore(score: number): { letter: string; points: number } {
        for (const grade of this.gradeScale) {
            if (score >= grade.min && score <= grade.max) {
                return { letter: grade.letter, points: grade.points };
            }
        }
        return { letter: 'F', points: 0 };
    }

    /**
     * Get academic classification from Average Score
     */
    getClassificationFromScore(avgScore: number): { nameAr: string } {
        for (const classification of this.classifications) {
            if (avgScore >= classification.minScore) {
                return { nameAr: classification.nameAr };
            }
        }
        return { nameAr: 'غير مصنف' };
    }

    /**
     * Validate input scores
     */
    private validateScores(input: GradeInput): void {
        const { courseworkScore, finalExamScore, units } = input;
        const maxCoursework = input.maxCoursework ?? 40;
        const maxFinalExam = input.maxFinalExam ?? 60;

        if (courseworkScore < 0 || courseworkScore > maxCoursework) {
            throw new Error(`Coursework score must be between 0 and ${maxCoursework}`);
        }

        if (finalExamScore < 0 || finalExamScore > maxFinalExam) {
            throw new Error(`Final exam score must be between 0 and ${maxFinalExam}`);
        }

        if (units < 1 || units > 6) {
            throw new Error('Course units must be between 1 and 6');
        }
    }

    /**
     * Round a number to specified decimal places
     * Using a deterministic method to avoid floating-point errors
     */
    public roundToDecimal(value: number, decimals: number): number {
        const multiplier = Math.pow(10, decimals);
        return Math.round((value + Number.EPSILON) * multiplier) / multiplier;
    }

    /**
     * Get the grading scale (for display purposes)
     */
    getGradingScale(): GradeScale[] {
        return [...this.gradeScale];
    }

    /**
     * Check if a score is passing
     */
    isPassing(score: number): boolean {
        return score >= this.PASSING_SCORE;
    }

    /**
     * Calculate the minimum score needed for a target grade
     */
    getMinScoreForGrade(letterGrade: string): number | null {
        const grade = this.gradeScale.find(g => g.letter === letterGrade);
        return grade ? grade.min : null;
    }
}
