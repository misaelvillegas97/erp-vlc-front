import { ChecklistQuestion, ChecklistQuestionResponse } from '../interfaces/checklist-question.interface';
import { ChecklistCategory, ChecklistCategoryScore }    from '../interfaces/checklist-category.interface';
import { ChecklistTemplate, ChecklistTemplateScore }    from '../interfaces/checklist-template.interface';
import { ChecklistGroupScore }                          from '../interfaces/checklist-group.interface';

export class ChecklistScoreCalculator {

    /**
     * Calculate normalized score for a question response (0-1)
     * Uses the new approval-based scoring system
     */
    static calculateQuestionScore(question: ChecklistQuestion, response: ChecklistQuestionResponse): number {
        // If no response and question is required, return 0
        if (!response.value && question.required) {
            return 0;
        }

        // If no response but question is not required, return 1 (neutral)
        if (!response.value && !question.required) {
            return 1;
        }

        // ✅ NEW: Approval-based scoring system
        // The response.value contains the numeric score directly:
        // - 1.0 for "Aprobado"
        // - question.intermediateValue for "Parcial" (if hasIntermediateApproval is true)
        // - 0.0 for "No Aprobado"
        const numericValue = Number(response.value);

        // Validate the numeric value is within expected range
        if (isNaN(numericValue) || numericValue < 0 || numericValue > 1) {
            return 0;
        }

        return numericValue;
    }

    /**
     * Calculate category score based on question responses
     */
    static calculateCategoryScore(category: ChecklistCategory, responses: ChecklistQuestionResponse[]): ChecklistCategoryScore {
        const questionScores = category.questions.map(question => {
            const response = responses.find(r => r.questionId === question.id);
            const score = response ? this.calculateQuestionScore(question, response) : 0;
            return {
                question,
                response,
                score,
                weightedScore: score * question.weight
            };
        });

        const totalWeight = category.questions.reduce((sum, q) => sum + q.weight, 0);
        const weightedSum = questionScores.reduce((sum, qs) => sum + qs.weightedScore, 0);
        const score = totalWeight > 0 ? weightedSum / totalWeight : 0;

        return {
            categoryId        : category.id!,
            title             : category.title,
            weight: totalWeight, // ✅ CHANGED: Use sum of question weights instead of category.weight
            score,
            maxPossibleScore  : 1,
            questionsCompleted: questionScores.filter(qs => qs.response).length,
            totalQuestions    : category.questions.length
        };
    }

    /**
     * Calculate template score based on category scores
     */
    static calculateTemplateScore(template: ChecklistTemplate, categoryScores: ChecklistCategoryScore[]): ChecklistTemplateScore {
        // ✅ CHANGED: Calculate total weight as sum of all question weights across all categories
        const totalWeight = template.categories.reduce((sum, category) => {
            const categoryQuestionWeight = category.questions.reduce((qSum, question) => qSum + question.weight, 0);
            return sum + categoryQuestionWeight;
        }, 0);

        // ✅ CHANGED: Calculate weighted sum using category weights (which are now sum of question weights)
        const weightedSum = categoryScores.reduce((sum, cs) => {
            return sum + (cs.score * cs.weight); // cs.weight is now the sum of question weights in that category
        }, 0);

        const score = totalWeight > 0 ? weightedSum / totalWeight : 0;
        const passed = template.performanceThreshold ? score >= (template.performanceThreshold / 100) : true;

        return {
            templateId    : template.id!,
            name          : template.name,
            weight: template.weight || 1.0, // Default weight for standalone templates
            score,
            passed,
            categoryScores: categoryScores.map(cs => ({
                categoryId: cs.categoryId,
                title     : cs.title,
                score     : cs.score,
                weight    : cs.weight
            }))
        };
    }

    /**
     * Calculate group score based on template scores
     */
    static calculateGroupScore(groupId: string, groupName: string, groupWeight: number, templateScores: ChecklistTemplateScore[], performanceThreshold?: number): ChecklistGroupScore {
        const totalWeight = templateScores.reduce((sum, ts) => sum + ts.weight, 0);
        const weightedSum = templateScores.reduce((sum, ts) => sum + (ts.score * ts.weight), 0);

        const score = totalWeight > 0 ? weightedSum / totalWeight : 0;
        const passed = performanceThreshold ? score >= (performanceThreshold / 100) : templateScores.every(ts => ts.passed);

        return {
            groupId,
            name              : groupName,
            weight            : groupWeight,
            score,
            passed,
            templateScores,
            completedTemplates: templateScores.length,
            totalTemplates    : templateScores.length
        };
    }

    /**
     * Validate that weights sum to 1.0 (with tolerance)
     */
    static validateWeights(weights: number[], tolerance: number = 0.01): boolean {
        const sum = weights.reduce((acc, weight) => acc + weight, 0);
        return Math.abs(sum - 1.0) <= tolerance;
    }
}
