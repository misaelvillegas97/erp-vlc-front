/**
 * Type of flow step
 * STANDARD: Regular step with form fields and execution
 * GATE: Decision point that can route to different paths
 * END: Final step that terminates the flow
 */
export enum StepType {
    STANDARD = 'STANDARD',
    GATE = 'GATE',
    END = 'END',
}
