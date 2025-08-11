export enum StepExecutionStatus {
    PENDING = 'PENDING',         // Step is waiting to be started
    IN_PROGRESS = 'IN_PROGRESS', // Step is currently being executed
    DONE = 'DONE',               // Step has been completed successfully
    SKIPPED = 'SKIPPED',         // Step was skipped due to conditions
    FAILED = 'FAILED',           // Step execution failed
    RESTARTED = 'RESTARTED',     // Step was restarted after failure
}

export enum FlowInstanceStatus {
    ACTIVE = 'ACTIVE',       // Flow instance is currently being executed
    CANCELLED = 'CANCELLED', // Flow instance was cancelled before completion
    FINISHED = 'FINISHED',   // Flow instance completed successfully
}
