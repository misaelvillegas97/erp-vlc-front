import { ChecklistQuestion, ChecklistQuestionResponse } from '../interfaces/checklist-question.interface';
import { ChecklistCategory, ChecklistCategoryScore }    from '../interfaces/checklist-category.interface';
import { ChecklistTemplate, ChecklistTemplateScore }    from '../interfaces/checklist-template.interface';
import { ChecklistGroupScore }                          from '../interfaces/checklist-group.interface';
import { ResponseType }                                 from '../enums/response-type.enum';

export class ChecklistScoreCalculator {

    /**
     * Calculate normalized score for a question response (0-1)
     */
    static calculateQuestionScore(question: ChecklistQuestion, response: ChecklistQuestionResponse): number {
        if (!response.value && question.required) {
            return 0;
        }

        switch (question.responseType) {
            case ResponseType.CHECKBOX:
                return response.value ? 1 : 0;

            case ResponseType.NUMERIC:
                if (question.numericRange) {
                    const {min, max} = question.numericRange;
                    const value = Number(response.value);
                    if (isNaN(value)) return 0;
                    return Math.max(0, Math.min(1, (value - min) / (max - min)));
                }
                return response.value > 0 ? 1 : 0;

            case ResponseType.MULTIPLE_CHOICE:
                // Assume first option is best, last is worst
                if (question.options && question.options.length > 0) {
                    const selectedIndex = question.options.indexOf(response.value);
                    if (selectedIndex === -1) return 0;
                    return 1 - (selectedIndex / (question.options.length - 1));
                }
                return response.value ? 1 : 0;

            case ResponseType.TEXT:
                return response.value && response.value.trim().length > 0 ? 1 : 0;

            case ResponseType.FILE_UPLOAD:
                return response.files && response.files.length > 0 ? 1 : 0;

            default:
                return 0;
        }
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
            weight            : category.weight,
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
        const totalWeight = template.categories.reduce((sum, c) => sum + c.weight, 0);
        const weightedSum = categoryScores.reduce((sum, cs) => {
            const category = template.categories.find(c => c.id === cs.categoryId);
            return sum + (cs.score * (category?.weight || 0));
        }, 0);

        const score = totalWeight > 0 ? weightedSum / totalWeight : 0;
        const passed = template.scoreThreshold ? score >= template.scoreThreshold : true;

        return {
            templateId    : template.id!,
            name          : template.name,
            weight        : template.weight,
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
    static calculateGroupScore(groupId: string, groupName: string, groupWeight: number, templateScores: ChecklistTemplateScore[], scoreThreshold?: number): ChecklistGroupScore {
        const totalWeight = templateScores.reduce((sum, ts) => sum + ts.weight, 0);
        const weightedSum = templateScores.reduce((sum, ts) => sum + (ts.score * ts.weight), 0);

        const score = totalWeight > 0 ? weightedSum / totalWeight : 0;
        const passed = scoreThreshold ? score >= scoreThreshold : templateScores.every(ts => ts.passed);

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
