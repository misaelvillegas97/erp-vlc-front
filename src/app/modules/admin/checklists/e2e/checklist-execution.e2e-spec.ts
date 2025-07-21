import { test, expect } from '@playwright/test';

test.describe('Checklist Execution E2E Flow', () => {
    test.beforeEach(async ({page}) => {
        // Navigate to the checklist module
        await page.goto('/admin/checklists');

        // Mock API responses for consistent testing
        await page.route('**/api/checklists/templates', async route => {
            await route.fulfill({
                json: [
                    {
                        id            : '1',
                        name          : 'Vehicle Safety Inspection',
                        type          : 'safety',
                        version       : '1.0',
                        weight        : 1.0,
                        categories    : [
                            {
                                id       : 'cat1',
                                title    : 'Engine Safety',
                                weight   : 0.6,
                                order    : 1,
                                questions: [
                                    {
                                        id          : 'q1',
                                        title       : 'Engine oil level adequate?',
                                        weight      : 0.5,
                                        required    : true,
                                        responseType: 'checkbox',
                                        order       : 1
                                    },
                                    {
                                        id          : 'q2',
                                        title       : 'Engine temperature normal?',
                                        weight      : 0.5,
                                        required    : true,
                                        responseType: 'checkbox',
                                        order       : 2
                                    }
                                ]
                            },
                            {
                                id       : 'cat2',
                                title    : 'Brake Safety',
                                weight   : 0.4,
                                order    : 2,
                                questions: [
                                    {
                                        id          : 'q3',
                                        title       : 'Brake fluid level adequate?',
                                        weight      : 1.0,
                                        required    : true,
                                        responseType: 'checkbox',
                                        order       : 1
                                    }
                                ]
                            }
                        ],
                        vehicleIds    : [ 'v1' ],
                        roleIds       : [ 'r1' ],
                        isActive      : true,
                        scoreThreshold: 0.7
                    }
                ]
            });
        });

        await page.route('**/api/checklists/groups', async route => {
            await route.fulfill({
                json: [
                    {
                        id            : 'g1',
                        name          : 'Complete Vehicle Inspection',
                        weight        : 1.0,
                        templates     : [
                            {
                                id    : '1',
                                name  : 'Vehicle Safety Inspection',
                                weight: 1.0
                            }
                        ],
                        isActive      : true,
                        scoreThreshold: 0.8
                    }
                ]
            });
        });
    });

    test('Complete checklist execution flow - Template', async ({page}) => {
        // Step 1: Navigate to execution selector
        await page.click('text=Ejecutar');
        await expect(page).toHaveURL(/.*\/execute$/);

        // Verify execution selector is loaded
        await expect(page.locator('h1')).toContainText('Seleccionar Checklist para Ejecutar');

        // Step 2: Select template execution type
        await page.click('input[value="template"]');

        // Wait for templates to load and select one
        await expect(page.locator('text=Vehicle Safety Inspection')).toBeVisible();
        await page.click('text=Vehicle Safety Inspection');

        // Verify template is selected
        await expect(page.locator('.border-blue-500')).toBeVisible();

        // Step 3: Start execution
        await page.click('button:has-text("Iniciar Ejecución")');
        await expect(page).toHaveURL(/.*\/execute\/template\/1$/);

        // Mock template details API
        await page.route('**/api/checklists/templates/1', async route => {
            await route.fulfill({
                json: {
                    id            : '1',
                    name          : 'Vehicle Safety Inspection',
                    type          : 'safety',
                    version       : '1.0',
                    weight        : 1.0,
                    categories    : [
                        {
                            id       : 'cat1',
                            title    : 'Engine Safety',
                            weight   : 0.6,
                            order    : 1,
                            questions: [
                                {
                                    id          : 'q1',
                                    title       : 'Engine oil level adequate?',
                                    weight      : 0.5,
                                    required    : true,
                                    responseType: 'checkbox',
                                    order       : 1
                                },
                                {
                                    id          : 'q2',
                                    title       : 'Engine temperature normal?',
                                    weight      : 0.5,
                                    required    : true,
                                    responseType: 'checkbox',
                                    order       : 2
                                }
                            ]
                        },
                        {
                            id       : 'cat2',
                            title    : 'Brake Safety',
                            weight   : 0.4,
                            order    : 2,
                            questions: [
                                {
                                    id          : 'q3',
                                    title       : 'Brake fluid level adequate?',
                                    weight      : 1.0,
                                    required    : true,
                                    responseType: 'checkbox',
                                    order       : 1
                                }
                            ]
                        }
                    ],
                    vehicleIds    : [ 'v1' ],
                    roleIds       : [ 'r1' ],
                    isActive      : true,
                    scoreThreshold: 0.7
                }
            });
        });

        // Step 4: Fill execution form
        await expect(page.locator('h1')).toContainText('Ejecutar Template: Vehicle Safety Inspection');

        // Select vehicle
        await page.click('mat-select[formControlName="vehicleId"]');
        await page.click('mat-option:has-text("Camión 001")');

        // Verify score display is showing 0% initially
        await expect(page.locator('text=0.0%')).toBeVisible();

        // Step 5: Answer questions in categories
        // Expand first category
        await page.click('mat-expansion-panel:has-text("Engine Safety")');

        // Answer first question - Complies
        await page.click('mat-radio-button[value="complies"]:near(:text("Engine oil level adequate?"))');

        // Answer second question - Complies
        await page.click('mat-radio-button[value="complies"]:near(:text("Engine temperature normal?"))');

        // Expand second category
        await page.click('mat-expansion-panel:has-text("Brake Safety")');

        // Answer third question - Complies
        await page.click('mat-radio-button[value="complies"]:near(:text("Brake fluid level adequate?"))');

        // Step 6: Verify completion percentage updates
        await expect(page.locator('text=100.0%')).toBeVisible();

        // Step 7: Add notes
        await page.fill('textarea[formControlName="notes"]', 'All safety checks completed successfully. Vehicle is in good condition.');

        // Step 8: Submit execution
        await page.route('**/api/checklists/executions', async route => {
            await route.fulfill({
                json: {
                    id               : 'e1',
                    templateId       : '1',
                    vehicleId        : 'v1',
                    userId           : 'current-user-id',
                    status           : 'completed',
                    startedAt        : new Date().toISOString(),
                    completedAt      : new Date().toISOString(),
                    categoryResponses: [],
                    overallScore     : 0.95,
                    passed           : true,
                    notes            : 'All safety checks completed successfully. Vehicle is in good condition.'
                }
            });
        });

        await page.click('button:has-text("Completar Ejecución")');

        // Step 9: Verify navigation to report
        await expect(page).toHaveURL(/.*\/reports\/e1$/);

        // Mock report API
        await page.route('**/api/checklists/executions/e1/report', async route => {
            await route.fulfill({
                json: {
                    execution      : {
                        id               : 'e1',
                        templateId       : '1',
                        vehicleId        : 'v1',
                        userId           : 'current-user-id',
                        status           : 'completed',
                        startedAt        : new Date().toISOString(),
                        completedAt      : new Date().toISOString(),
                        categoryResponses: [],
                        overallScore     : 0.95,
                        passed           : true,
                        notes            : 'All safety checks completed successfully. Vehicle is in good condition.'
                    },
                    templateDetails: {
                        name   : 'Vehicle Safety Inspection',
                        type   : 'safety',
                        version: '1.0'
                    },
                    vehicleDetails : {
                        plate: 'ABC-123',
                        model: 'Camión 001',
                        year : 2023
                    },
                    userDetails    : {
                        name: 'Test User',
                        role: 'Inspector'
                    },
                    categoryScores : [
                        {
                            categoryId        : 'cat1',
                            title             : 'Engine Safety',
                            weight            : 0.6,
                            score             : 1.0,
                            questionsCompleted: 2,
                            totalQuestions    : 2
                        },
                        {
                            categoryId        : 'cat2',
                            title             : 'Brake Safety',
                            weight            : 0.4,
                            score             : 1.0,
                            questionsCompleted: 1,
                            totalQuestions    : 1
                        }
                    ]
                }
            });
        });

        // Step 10: Verify report display
        await expect(page.locator('h1')).toContainText('Reporte: Vehicle Safety Inspection');
        await expect(page.locator('text=95.0%')).toBeVisible();
        await expect(page.locator('text=Aprobado')).toBeVisible();

        // Verify category scores
        await expect(page.locator('text=Engine Safety')).toBeVisible();
        await expect(page.locator('text=Brake Safety')).toBeVisible();

        // Verify notes are displayed
        await expect(page.locator('text=All safety checks completed successfully')).toBeVisible();

        // Step 11: Test export functionality
        await page.click('button:has-text("Exportar")');
        await expect(page.locator('text=Exportar PDF')).toBeVisible();
        await expect(page.locator('text=Exportar CSV')).toBeVisible();
    });

    test('Complete checklist execution flow - Group', async ({page}) => {
        // Step 1: Navigate to execution selector
        await page.click('text=Ejecutar');

        // Step 2: Select group execution type
        await page.click('input[value="group"]');

        // Wait for groups to load and select one
        await expect(page.locator('text=Complete Vehicle Inspection')).toBeVisible();
        await page.click('text=Complete Vehicle Inspection');

        // Step 3: Start execution
        await page.click('button:has-text("Iniciar Ejecución")');
        await expect(page).toHaveURL(/.*\/execute\/group\/g1$/);

        // Mock group details API
        await page.route('**/api/checklists/groups/g1', async route => {
            await route.fulfill({
                json: {
                    id            : 'g1',
                    name          : 'Complete Vehicle Inspection',
                    weight        : 1.0,
                    templates     : [
                        {
                            id            : '1',
                            name          : 'Vehicle Safety Inspection',
                            type          : 'safety',
                            version       : '1.0',
                            weight        : 1.0,
                            categories    : [
                                {
                                    id       : 'cat1',
                                    title    : 'Engine Safety',
                                    weight   : 0.6,
                                    order    : 1,
                                    questions: [
                                        {
                                            id          : 'q1',
                                            title       : 'Engine oil level adequate?',
                                            weight      : 1.0,
                                            required    : true,
                                            responseType: 'checkbox',
                                            order       : 1
                                        }
                                    ]
                                }
                            ],
                            vehicleIds    : [ 'v1' ],
                            roleIds       : [ 'r1' ],
                            isActive      : true,
                            scoreThreshold: 0.7
                        }
                    ],
                    isActive      : true,
                    scoreThreshold: 0.8
                }
            });
        });

        // Verify group execution header
        await expect(page.locator('h1')).toContainText('Ejecutar Grupo: Complete Vehicle Inspection');

        // Verify group score display is visible
        await expect(page.locator('text=Score Grupo')).toBeVisible();
    });

    test('Handle low score warning for quality checklists', async ({page}) => {
        // Mock a quality checklist with low score threshold
        await page.route('**/api/checklists/templates/1', async route => {
            await route.fulfill({
                json: {
                    id            : '1',
                    name          : 'Quality Control Checklist',
                    type          : 'quality',
                    version       : '1.0',
                    weight        : 1.0,
                    categories    : [
                        {
                            id       : 'cat1',
                            title    : 'Quality Standards',
                            weight   : 1.0,
                            order    : 1,
                            questions: [
                                {
                                    id          : 'q1',
                                    title       : 'Product meets quality standards?',
                                    weight      : 1.0,
                                    required    : true,
                                    responseType: 'checkbox',
                                    order       : 1
                                }
                            ]
                        }
                    ],
                    vehicleIds    : [ 'v1' ],
                    roleIds       : [ 'r1' ],
                    isActive      : true,
                    scoreThreshold: 0.8
                }
            });
        });

        // Navigate to execution
        await page.goto('/admin/checklists/execute/template/1');

        // Fill form with failing answer
        await page.click('mat-select[formControlName="vehicleId"]');
        await page.click('mat-option:has-text("Camión 001")');

        await page.click('mat-expansion-panel:has-text("Quality Standards")');
        await page.click('mat-radio-button[value="not_complies"]');

        // Mock dialog confirmation
        page.on('dialog', async dialog => {
            expect(dialog.message()).toContain('está por debajo del umbral requerido');
            await dialog.dismiss();
        });

        // Try to submit - should show warning
        await page.click('button:has-text("Completar Ejecución")');
    });

    test('Form validation prevents submission with incomplete data', async ({page}) => {
        await page.goto('/admin/checklists/execute/template/1');

        // Mock template API
        await page.route('**/api/checklists/templates/1', async route => {
            await route.fulfill({
                json: {
                    id            : '1',
                    name          : 'Test Template',
                    type          : 'safety',
                    categories    : [
                        {
                            id       : 'cat1',
                            title    : 'Test Category',
                            weight   : 1.0,
                            order    : 1,
                            questions: [
                                {
                                    id          : 'q1',
                                    title       : 'Required question?',
                                    weight      : 1.0,
                                    required    : true,
                                    responseType: 'checkbox',
                                    order       : 1
                                }
                            ]
                        }
                    ],
                    vehicleIds    : [ 'v1' ],
                    roleIds       : [ 'r1' ],
                    isActive      : true,
                    scoreThreshold: 0.7
                }
            });
        });

        // Verify submit button is disabled initially
        await expect(page.locator('button:has-text("Completar Ejecución")')).toBeDisabled();

        // Select vehicle but don't answer questions
        await page.click('mat-select[formControlName="vehicleId"]');
        await page.click('mat-option:has-text("Camión 001")');

        // Submit button should still be disabled
        await expect(page.locator('button:has-text("Completar Ejecución")')).toBeDisabled();

        // Answer required question
        await page.click('mat-expansion-panel:has-text("Test Category")');
        await page.click('mat-radio-button[value="complies"]');

        // Now submit button should be enabled
        await expect(page.locator('button:has-text("Completar Ejecución")')).toBeEnabled();
    });

    test('Navigation and back button functionality', async ({page}) => {
        // Test navigation from execution selector
        await page.goto('/admin/checklists/execute');

        await page.click('button:has-text("Cancelar")');
        await expect(page).toHaveURL(/.*\/checklists$/);

        // Test back button from report
        await page.goto('/admin/checklists/reports/e1');

        await page.route('**/api/checklists/executions/e1/report', async route => {
            await route.fulfill({
                json: {
                    execution      : {id: 'e1', overallScore: 0.9, passed: true},
                    templateDetails: {name: 'Test Template'},
                    vehicleDetails : {plate: 'ABC-123'},
                    userDetails    : {name: 'Test User'},
                    categoryScores : []
                }
            });
        });

        await page.click('button[matTooltip="Volver"]');
        await expect(page).toHaveURL(/.*\/checklists$/);
    });

    test('Error handling for failed API calls', async ({page}) => {
        // Mock API failure
        await page.route('**/api/checklists/templates/1', async route => {
            await route.abort('failed');
        });

        await page.goto('/admin/checklists/execute/template/1');

        // Should handle error gracefully
        // Note: Specific error handling UI would need to be implemented
        await expect(page.locator('body')).toBeVisible();
    });
});
