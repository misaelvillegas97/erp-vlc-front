export interface RequiredMetadata {
    /**
     * The name of the required metadata
     */
    name: string;

    /**
     * The type of the required metadata
     */
    type: string;

    /**
     * The description of the required metadata
     */
    description: string;

    /**
     * The default value of the required metadata
     */
    defaultValue?: any;

    /**
     * The validation rules for the required metadata
     */
    validationRules?: {
        [key: string]: any;
    };
}
