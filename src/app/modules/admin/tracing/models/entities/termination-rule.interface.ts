export interface TerminationRule {
    id: string;
    flowVersionId: string;
    scope: 'STEP' | 'FLOW';
    when: {
        event: 'onStepEnd' | 'onFlowEnd';
        stepKey?: string;
    };
    conditionExpr: string;
    actionsJson: Array<{
        type: 'SEND_EMAIL' | 'CANCEL_FLOW' | 'CREATE_ORDER' | 'INVENTORY_ADJUST' | 'CALL_WEBHOOK';
        [key: string]: any;
    }>;
    name?: string;
    description?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
