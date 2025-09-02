import { ChangeDetectionStrategy, Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule }                                                         from '@angular/common';
import { Router, ActivatedRoute }                                               from '@angular/router';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule }   from '@angular/forms';
import { MatButtonModule }                                                      from '@angular/material/button';
import { MatCardModule }                                                        from '@angular/material/card';
import { MatCheckboxModule }                                                    from '@angular/material/checkbox';
import { MatDialogModule, MatDialog }                                           from '@angular/material/dialog';
import { MatExpansionModule }                                                   from '@angular/material/expansion';
import { MatFormFieldModule }                                                   from '@angular/material/form-field';
import { MatIconModule }                                                        from '@angular/material/icon';
import { MatInputModule }                                                       from '@angular/material/input';
import { MatProgressSpinnerModule }                                             from '@angular/material/progress-spinner';
import { MatRadioModule }                                                       from '@angular/material/radio';
import { MatSelectModule }                                                      from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule }                                       from '@angular/material/snack-bar';
import { MatStepperModule }                                                     from '@angular/material/stepper';
import { MatToolbarModule }                                                     from '@angular/material/toolbar';
import { MatTooltipModule }                                                     from '@angular/material/tooltip';
import { DomSanitizer, SafeResourceUrl }                                        from '@angular/platform-browser';
import { CreateAcknowledgementDto, CreateEConsentDto, PublicationsService }     from '@modules/admin/procedures/services';
import { EConsent, Publication }                                                from '@modules/admin/procedures/domain/interfaces';
import { SignatureType }                                                        from '@modules/admin/procedures/domain/enums';

interface QuizQuestion {
    id: string;
    question: string;
    options: string[];
    correctAnswer: number;
    explanation?: string;
}

@Component({
    selector       : 'app-publication-viewer',
    standalone     : true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports        : [
        CommonModule,
        ReactiveFormsModule,
        MatButtonModule,
        MatCardModule,
        MatCheckboxModule,
        MatDialogModule,
        MatExpansionModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        MatProgressSpinnerModule,
        MatRadioModule,
        MatSelectModule,
        MatSnackBarModule,
        MatStepperModule,
        MatToolbarModule,
        MatTooltipModule
    ],
    template       : `
        <div class="flex flex-col h-full">
            <!-- Header Toolbar -->
            <mat-toolbar class="border-b border-gray-200 bg-white">
                <button mat-icon-button (click)="goBack()" matTooltip="Back to inbox">
                    <mat-icon>arrow_back</mat-icon>
                </button>
                <span class="flex-1 ml-4">
                    @if (publication()) {
                        <span class="text-lg font-medium">
                            {{ publication()?.version?.procedure?.title }}
                        </span>
                        <span class="text-sm text-gray-600 ml-2">
                            Version {{ publication()?.version?.number }}
                        </span>
                    }
                </span>

                <!-- Legal status indicators -->
                <div class="flex items-center gap-2">
                    @if (publication()?.version?.modifiesInternalRegulations) {
                        <span class="inline-flex items-center px-3 py-1 rounded-full text-xs bg-red-100 text-red-800">
                            <mat-icon class="mr-1" style="font-size: 14px;">gavel</mat-icon>
                            Legal Requirement
                        </span>
                    }
                    @if (hasRequiredQuiz()) {
                        <span class="inline-flex items-center px-3 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                            <mat-icon class="mr-1" style="font-size: 14px;">quiz</mat-icon>
                            Quiz Required
                        </span>
                    }
                </div>
            </mat-toolbar>

            <!-- Main Content -->
            <div class="flex-1 overflow-hidden">
                <div class="h-full overflow-auto p-6">
                    <div class="max-w-4xl mx-auto">
                        @if (isLoading()) {
                            <div class="flex items-center justify-center h-64">
                                <mat-progress-spinner diameter="40"></mat-progress-spinner>
                            </div>
                        } @else if (publication()) {
                            <!-- Publication Info -->
                            <mat-card class="mb-6">
                                <mat-card-header>
                                    <mat-card-title>{{ publication()?.version?.procedure?.title }}</mat-card-title>
                                    <mat-card-subtitle>
                                        Version {{ publication()?.version?.number }} •
                                        Published {{ publication()?.createdAt | date:'mediumDate' }}
                                    </mat-card-subtitle>
                                </mat-card-header>
                                <mat-card-content class="pt-4">
                                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <h4 class="text-sm font-medium text-gray-600 mb-1">Category</h4>
                                            <p>{{ publication()?.version?.procedure?.category || 'General' }}</p>
                                        </div>
                                        @if (publication()?.validUntil) {
                                            <div>
                                                <h4 class="text-sm font-medium text-gray-600 mb-1">Valid Until</h4>
                                                <p>{{ publication()?.validUntil | date:'mediumDate' }}</p>
                                            </div>
                                        }
                                    </div>

                                    @if (publication()?.message) {
                                        <div class="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
                                            <h4 class="text-sm font-medium text-blue-800 mb-1">Publisher Message</h4>
                                            <p class="text-sm text-blue-900">{{ publication()?.message }}</p>
                                        </div>
                                    }
                                </mat-card-content>
                            </mat-card>

                            <!-- Legal Notice for Internal Regulations -->
                            @if (publication()?.version?.modifiesInternalRegulations) {
                                <mat-card class="mb-6 border-l-4 border-red-500">
                                    <mat-card-content class="pt-4">
                                        <div class="flex items-start">
                                            <mat-icon class="text-red-500 mr-3">warning</mat-icon>
                                            <div>
                                                <h3 class="text-lg font-semibold text-red-800 mb-2">Important Legal Notice</h3>
                                                <p class="text-sm text-red-700 mb-3">
                                                    This procedure modifies Internal Regulations. Your acknowledgment is mandatory
                                                    under Chilean Labor Code (Articles 153 and 156).
                                                </p>
                                                <ul class="text-sm text-red-700 list-disc ml-4">
                                                    <li>You must read and understand all content</li>
                                                    <li>Electronic acknowledgment has legal validity</li>
                                                    <li>This replaces previous versions of the same procedure</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </mat-card-content>
                                </mat-card>
                            }

                            <!-- E-Consent Notice -->
                            @if (!hasValidEConsent() && requiresEConsent()) {
                                <mat-card class="mb-6 border-l-4 border-blue-500">
                                    <mat-card-content class="pt-4">
                                        <div class="flex items-start">
                                            <mat-icon class="text-blue-500 mr-3">info</mat-icon>
                                            <div class="flex-1">
                                                <h3 class="text-lg font-semibold text-blue-800 mb-2">Electronic Documentation Consent</h3>
                                                <p class="text-sm text-blue-700 mb-3">
                                                    In compliance with Chilean Law 19.799 (Electronic Signature Law), we need your
                                                    consent to process this document electronically.
                                                </p>
                                                <button mat-raised-button color="primary" (click)="requestEConsent()">
                                                    Provide Electronic Consent
                                                </button>
                                            </div>
                                        </div>
                                    </mat-card-content>
                                </mat-card>
                            }

                            <!-- Legal References -->
                            @if (publication()?.version?.legalReferences?.length) {
                                <mat-card class="mb-6">
                                    <mat-card-header>
                                        <mat-card-title class="flex items-center">
                                            <mat-icon class="mr-2">gavel</mat-icon>
                                            Legal Framework
                                        </mat-card-title>
                                    </mat-card-header>
                                    <mat-card-content class="pt-4">
                                        <div class="space-y-3">
                                            @for (ref of publication()!.version!.legalReferences; track $index) {
                                                <div class="flex items-start p-3 bg-blue-50 rounded-lg">
                                                    <mat-icon class="text-blue-600 mr-2 mt-0.5">library_books</mat-icon>
                                                    <div class="flex-1">
                                                        <div class="flex items-center gap-2">
                                                            <span class="font-medium text-blue-900">{{ ref.norma }}</span>
                                                            @if (ref.articulo) {
                                                                <span class="text-sm text-blue-700">{{ ref.articulo }}</span>
                                                            }
                                                        </div>
                                                        @if (ref.nota) {
                                                            <p class="text-sm text-blue-800 mt-1">{{ ref.nota }}</p>
                                                        }
                                                    </div>
                                                </div>
                                            }
                                        </div>
                                    </mat-card-content>
                                </mat-card>
                            }

                            <!-- PDF Viewer -->
                            @if (publication()?.pdfUrl) {
                                <mat-card class="mb-6">
                                    <mat-card-header>
                                        <mat-card-title class="flex items-center justify-between w-full">
                                            <span class="flex items-center">
                                                <mat-icon class="mr-2">picture_as_pdf</mat-icon>
                                                Procedure Document
                                            </span>
                                            <div class="flex gap-2">
                                                <button mat-button (click)="downloadPDF()" matTooltip="Download PDF">
                                                    <mat-icon>download</mat-icon>
                                                    Download
                                                </button>
                                                <button mat-button (click)="openPDFNewTab()" matTooltip="Open in new tab">
                                                    <mat-icon>open_in_new</mat-icon>
                                                    Open
                                                </button>
                                            </div>
                                        </mat-card-title>
                                    </mat-card-header>
                                    <mat-card-content class="pt-4">
                                        <div class="border border-gray-300 rounded" style="height: 600px;">
                                            <iframe
                                                [src]="pdfViewerUrl()"
                                                width="100%"
                                                height="100%"
                                                frameborder="0">
                                                <p>Your browser does not support PDF viewing.
                                                    <a [href]="publication()?.pdfUrl" target="_blank">Click here to download the PDF</a>
                                                </p>
                                            </iframe>
                                        </div>
                                    </mat-card-content>
                                </mat-card>
                            }

                            <!-- Procedure Content (if no PDF) -->
                            @if (!publication()?.pdfUrl && publication()?.version?.content?.sections?.length) {
                                <mat-card class="mb-6">
                                    <mat-card-header>
                                        <mat-card-title>Procedure Content</mat-card-title>
                                    </mat-card-header>
                                    <mat-card-content class="pt-4">
                                        <div class="space-y-6">
                                            @for (section of publication()!.version!.content.sections; track $index) {
                                                <div class="border-b border-gray-200 pb-4 last:border-b-0">
                                                    @if (section.title) {
                                                        <h3 class="text-lg font-semibold mb-3">{{ section.title }}</h3>
                                                    }
                                                    <div class="prose prose-sm max-w-none">
                                                        <pre class="whitespace-pre-wrap font-sans text-gray-800">{{ section.body }}</pre>
                                                    </div>
                                                </div>
                                            }
                                        </div>
                                    </mat-card-content>
                                </mat-card>
                            }

                            <!-- Quiz Section (for critical safety procedures) -->
                            @if (hasRequiredQuiz() && !quizCompleted()) {
                                <mat-card class="mb-6">
                                    <mat-card-header>
                                        <mat-card-title class="flex items-center">
                                            <mat-icon class="mr-2">quiz</mat-icon>
                                            Safety Knowledge Quiz
                                        </mat-card-title>
                                        <mat-card-subtitle>
                                            Please answer the following questions to verify your understanding
                                        </mat-card-subtitle>
                                    </mat-card-header>
                                    <mat-card-content class="pt-4">
                                        <form [formGroup]="quizForm">
                                            <div formArrayName="answers" class="space-y-6">
                                                @for (question of getQuizQuestions(); track question.id; let i = $index) {
                                                    <div class="p-4 border border-gray-200 rounded-lg">
                                                        <h4 class="font-medium mb-3">{{ i + 1 }}. {{ question.question }}</h4>
                                                        <mat-radio-group [formControlName]="i" class="flex flex-col gap-2">
                                                            @for (option of question.options; track $index; let j = $index) {
                                                                <mat-radio-button [value]="j">{{ option }}</mat-radio-button>
                                                            }
                                                        </mat-radio-group>
                                                    </div>
                                                }
                                            </div>

                                            @if (quizAttempted() && !quizCompleted()) {
                                                <div class="mt-4 p-3 bg-red-50 border border-red-200 rounded">
                                                    <div class="flex items-center">
                                                        <mat-icon class="text-red-500 mr-2">error</mat-icon>
                                                        <span class="text-red-800">
                                                            Some answers are incorrect. Please review and try again.
                                                        </span>
                                                    </div>
                                                </div>
                                            }

                                            <div class="flex justify-end mt-6">
                                                <button mat-raised-button color="primary"
                                                        (click)="submitQuiz()"
                                                        [disabled]="!quizForm.valid || isSubmittingQuiz()">
                                                    @if (isSubmittingQuiz()) {
                                                        <mat-progress-spinner diameter="16" class="mr-2"></mat-progress-spinner>
                                                    }
                                                    Submit Quiz
                                                </button>
                                            </div>
                                        </form>
                                    </mat-card-content>
                                </mat-card>
                            }

                            <!-- Quiz Results (if completed) -->
                            @if (quizCompleted()) {
                                <mat-card class="mb-6 border-l-4 border-green-500">
                                    <mat-card-content class="pt-4">
                                        <div class="flex items-center">
                                            <mat-icon class="text-green-500 mr-3">check_circle</mat-icon>
                                            <div>
                                                <h3 class="text-lg font-semibold text-green-800 mb-1">Quiz Completed Successfully</h3>
                                                <p class="text-sm text-green-700">
                                                    You have successfully demonstrated understanding of the safety procedures.
                                                </p>
                                            </div>
                                        </div>
                                    </mat-card-content>
                                </mat-card>
                            }

                            <!-- Acknowledgment Section -->
                            <mat-card class="mb-6">
                                <mat-card-header>
                                    <mat-card-title class="flex items-center">
                                        <mat-icon class="mr-2">how_to_reg</mat-icon>
                                        Acknowledgment
                                    </mat-card-title>
                                </mat-card-header>
                                <mat-card-content class="pt-4">
                                    <form [formGroup]="acknowledgmentForm">
                                        <!-- E-Consent checkbox for legal procedures -->
                                        @if (publication()?.version?.modifiesInternalRegulations && !hasValidEConsent()) {
                                            <div class="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
                                                <mat-checkbox formControlName="eConsent" required>
                                                    <span class="text-sm">
                                                        I consent to electronic processing of this document as per Law 19.799
                                                    </span>
                                                </mat-checkbox>
                                            </div>
                                        }

                                        <!-- Main acknowledgment -->
                                        <div class="mb-4">
                                            <mat-checkbox formControlName="hasRead" required>
                                                <span class="font-medium">
                                                    I have read, understood, and acknowledge this procedure
                                                </span>
                                            </mat-checkbox>
                                        </div>

                                        <!-- Understanding confirmation for legal procedures -->
                                        @if (publication()?.version?.modifiesInternalRegulations) {
                                            <div class="mb-4">
                                                <mat-checkbox formControlName="understands" required>
                                                    <span class="text-sm">
                                                        I understand that this modifies our Internal Regulations and 
                                                        affects my work obligations
                                                    </span>
                                                </mat-checkbox>
                                            </div>
                                        }

                                        <!-- Signature type selection -->
                                        <div class="mb-6">
                                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                                Digital Signature Type:
                                            </label>
                                            <mat-radio-group formControlName="signatureType" class="flex flex-col gap-2">
                                                <mat-radio-button value="fes">
                                                    <div>
                                                        <div class="font-medium">Simple Electronic Signature (FES)</div>
                                                        <div class="text-sm text-gray-600">
                                                            Standard digital acknowledgment with timestamp and device info
                                                        </div>
                                                    </div>
                                                </mat-radio-button>
                                                @if (publication()?.version?.modifiesInternalRegulations) {
                                                    <mat-radio-button value="fea">
                                                        <div>
                                                            <div class="font-medium">Advanced Electronic Signature (FEA)</div>
                                                            <div class="text-sm text-gray-600">
                                                                Enhanced security for legal compliance (recommended for Internal Regulations)
                                                            </div>
                                                        </div>
                                                    </mat-radio-button>
                                                }
                                            </mat-radio-group>
                                        </div>

                                        <!-- Device and location info -->
                                        <div class="mb-6 p-3 bg-gray-50 rounded">
                                            <h4 class="text-sm font-medium text-gray-700 mb-2">Signature Information</h4>
                                            <div class="text-xs text-gray-600 space-y-1">
                                                <div>Date: {{ currentDate() | date:'full' }}</div>
                                                <div>IP Address: {{ deviceInfo().ip || 'Detecting...' }}</div>
                                                <div>Device: {{ deviceInfo().userAgent }}</div>
                                            </div>
                                        </div>

                                        <div class="flex justify-between items-center">
                                            <div class="text-sm text-gray-600">
                                                @if (canAcknowledge()) {
                                                    <span class="text-green-600">✓ Ready to submit acknowledgment</span>
                                                } @else {
                                                    <span class="text-red-600">Please complete all required fields above</span>
                                                }
                                            </div>

                                            <button mat-raised-button color="primary"
                                                    (click)="submitAcknowledgment()"
                                                    [disabled]="!canAcknowledge() || isSubmittingAcknowledgment()">
                                                @if (isSubmittingAcknowledgment()) {
                                                    <mat-progress-spinner diameter="16" class="mr-2"></mat-progress-spinner>
                                                }
                                                <mat-icon class="mr-2">how_to_reg</mat-icon>
                                                {{ getAcknowledgmentButtonText() }}
                                            </button>
                                        </div>
                                    </form>
                                </mat-card-content>
                            </mat-card>
                        }
                    </div>
                </div>
            </div>
        </div>
    `
})
export class PublicationViewerComponent implements OnInit {
    private publicationsService = inject(PublicationsService);
    private router = inject(Router);
    private route = inject(ActivatedRoute);
    private fb = inject(FormBuilder);
    private dialog = inject(MatDialog);
    private snackBar = inject(MatSnackBar);
    private sanitizer = inject(DomSanitizer);

    // State signals
    isLoading = signal(true);
    publication = signal<Publication | null>(null);
    userEConsents = signal<EConsent[]>([]);
    isSubmittingAcknowledgment = signal(false);
    isSubmittingQuiz = signal(false);
    quizAttempted = signal(false);
    quizCompleted = signal(false);

    // Device info for signature
    deviceInfo = signal({
        ip       : '',
        userAgent: navigator.userAgent,
        timestamp: new Date()
    });

    // Forms
    acknowledgmentForm = this.fb.group({
        hasRead      : [ false, Validators.requiredTrue ],
        understands  : [ false ],
        eConsent     : [ false ],
        signatureType: [ 'fes', Validators.required ]
    });

    quizForm = this.fb.group({
        answers: this.fb.array([])
    });

    // Mock quiz questions - in real app these would come from the publication
    mockQuizQuestions: QuizQuestion[] = [
        {
            id           : '1',
            question     : 'What should you do if you encounter a safety hazard?',
            options      : [
                'Ignore it if it doesn\'t affect you',
                'Report it immediately to your supervisor',
                'Try to fix it yourself',
                'Wait until someone else notices'
            ],
            correctAnswer: 1,
            explanation  : 'Safety hazards should always be reported immediately to prevent accidents.'
        },
        {
            id           : '2',
            question     : 'How often should safety equipment be inspected?',
            options      : [
                'Once a year',
                'Only when it appears damaged',
                'According to the schedule specified in this procedure',
                'Never, it\'s maintenance\'s responsibility'
            ],
            correctAnswer: 2,
            explanation  : 'Safety equipment must be inspected according to established procedures.'
        },
        {
            id           : '3',
            question     : 'What is required before starting work with new equipment?',
            options      : [
                'Nothing special, just start working',
                'Read the manual if you have time',
                'Complete proper training and authorization',
                'Ask a coworker to show you quickly'
            ],
            correctAnswer: 2,
            explanation  : 'Proper training and authorization are mandatory before operating new equipment.'
        }
    ];

    // Computed signals
    hasValidEConsent = computed(() => {
        const publication = this.publication();
        if (!publication?.version?.modifiesInternalRegulations) return true;

        const consents = this.userEConsents();
        return consents.some(consent =>
            consent.policyCode === 'policy:e-doc-v1' &&
            new Date(consent.consentAt) > new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) // Valid for 1 year
        );
    });

    requiresEConsent = computed(() => {
        return this.publication()?.version?.modifiesInternalRegulations && !this.hasValidEConsent();
    });

    hasRequiredQuiz = computed(() => {
        // Mock logic: SSO (Safety & Health) procedures require quiz
        const category = this.publication()?.version?.procedure?.category;
        return category === 'SSO' || category === 'Safety & Health';
    });

    canAcknowledge = computed(() => {
        const form = this.acknowledgmentForm;
        const hasValidQuiz = !this.hasRequiredQuiz() || this.quizCompleted();
        const hasValidEConsent = !this.requiresEConsent() || this.hasValidEConsent() || form.get('eConsent')?.value;

        return form.valid && hasValidQuiz && hasValidEConsent;
    });

    pdfViewerUrl = computed(() => {
        const pdfUrl = this.publication()?.pdfUrl;
        if (!pdfUrl) return null;

        // Use PDF.js viewer - in production this should be properly configured
        return this.sanitizer.bypassSecurityTrustResourceUrl(
            `assets/pdfjs/web/viewer.html?file=${ encodeURIComponent(pdfUrl) }`
        ) as SafeResourceUrl;
    });

    currentDate = computed(() => new Date());

    ngOnInit(): void {
        this.route.params.subscribe(params => {
            const publicationId = params['id'];
            if (publicationId) {
                this.loadPublication(publicationId);
                this.loadUserEConsents();
                this.detectDeviceInfo();
            }
        });

        this.initializeQuizForm();
    }

    private async loadPublication(id: string): Promise<void> {
        this.isLoading.set(true);
        try {
            const publication = await this.publicationsService.getPublication(id).toPromise();
            this.publication.set(publication || null);
        } catch (error) {
            console.error('Error loading publication:', error);
            this.snackBar.open('Error loading procedure', 'Close', {duration: 3000});
        } finally {
            this.isLoading.set(false);
        }
    }

    private async loadUserEConsents(): Promise<void> {
        try {
            const consents = await this.publicationsService.getUserEConsents().toPromise();
            this.userEConsents.set(consents || []);
        } catch (error) {
            console.error('Error loading e-consents:', error);
        }
    }

    private detectDeviceInfo(): void {
        // In a real app, you might want to get the IP from your backend
        fetch('/api/client-info')
            .then(response => response.json())
            .then(data => {
                this.deviceInfo.update(info => ({...info, ip: data.ip}));
            })
            .catch(() => {
                // Fallback - IP will remain empty
            });
    }

    private initializeQuizForm(): void {
        const answersArray = this.fb.array([]);
        for (let i = 0; i < this.mockQuizQuestions.length; i++) {
            answersArray.push(this.fb.control(null, Validators.required));
        }
        this.quizForm.setControl('answers', answersArray);
    }

    getQuizQuestions(): QuizQuestion[] {
        return this.mockQuizQuestions;
    }

    submitQuiz(): void {
        if (!this.quizForm.valid) return;

        this.isSubmittingQuiz.set(true);
        this.quizAttempted.set(true);

        // Check answers
        const answers = this.quizForm.get('answers')?.value || [];
        const allCorrect = this.mockQuizQuestions.every((question, index) =>
            answers[index] === question.correctAnswer
        );

        setTimeout(() => {
            this.quizCompleted.set(allCorrect);
            this.isSubmittingQuiz.set(false);

            if (allCorrect) {
                this.snackBar.open('Quiz completed successfully!', 'Close', {
                    duration  : 3000,
                    panelClass: [ 'success-snackbar' ]
                });
            } else {
                this.snackBar.open('Some answers are incorrect. Please review and try again.', 'Close', {
                    duration  : 5000,
                    panelClass: [ 'error-snackbar' ]
                });
            }
        }, 1000); // Simulate processing time
    }

    async requestEConsent(): Promise<void> {
        try {
            const dto: CreateEConsentDto = {
                userId    : 'current-user', // In real app, get from auth service
                policyCode: 'policy:e-doc-v1',
                metadata  : {
                    ip       : this.deviceInfo().ip,
                    userAgent: this.deviceInfo().userAgent,
                    timestamp: new Date().toISOString()
                }
            };

            await this.publicationsService.createEConsent(dto).toPromise();
            await this.loadUserEConsents(); // Refresh consents
            this.snackBar.open('Electronic consent provided successfully', 'Close', {duration: 3000});
        } catch (error) {
            console.error('Error providing e-consent:', error);
            this.snackBar.open('Error providing consent', 'Close', {duration: 3000});
        }
    }

    async submitAcknowledgment(): Promise<void> {
        if (!this.canAcknowledge()) return;

        const publication = this.publication();
        if (!publication) return;

        this.isSubmittingAcknowledgment.set(true);

        try {
            // If e-consent is required and not yet provided, create it
            if (this.acknowledgmentForm.get('eConsent')?.value && this.requiresEConsent()) {
                await this.requestEConsent();
            }

            const dto: CreateAcknowledgementDto = {
                signatureType: this.acknowledgmentForm.get('signatureType')?.value as SignatureType,
                ip           : this.deviceInfo().ip,
                device       : {
                    userAgent: this.deviceInfo().userAgent,
                    timestamp: this.deviceInfo().timestamp.toISOString()
                },
                quizAnswers  : this.hasRequiredQuiz() ? this.quizForm.get('answers')?.value : undefined
            };

            await this.publicationsService.createAcknowledgement(publication.id, dto).toPromise();

            this.snackBar.open('Procedure acknowledged successfully!', 'Close', {
                duration  : 3000,
                panelClass: [ 'success-snackbar' ]
            });

            // Navigate back to inbox after successful acknowledgment
            setTimeout(() => {
                this.goBack();
            }, 2000);

        } catch (error) {
            console.error('Error submitting acknowledgment:', error);
            this.snackBar.open('Error submitting acknowledgment', 'Close', {duration: 3000});
        } finally {
            this.isSubmittingAcknowledgment.set(false);
        }
    }

    getAcknowledgmentButtonText(): string {
        const pub = this.publication();
        if (pub?.version?.modifiesInternalRegulations) {
            return 'I Acknowledge and Understand';
        }
        return 'I Have Read and Understand';
    }

    downloadPDF(): void {
        const pdfUrl = this.publication()?.pdfUrl;
        if (pdfUrl) {
            const a = document.createElement('a');
            a.href = pdfUrl;
            a.download = `${ this.publication()?.version?.procedure?.title || 'procedure' }.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        }
    }

    openPDFNewTab(): void {
        const pdfUrl = this.publication()?.pdfUrl;
        if (pdfUrl) {
            window.open(pdfUrl, '_blank');
        }
    }

    goBack(): void {
        this.router.navigate([ '/inbox/procedures' ]);
    }
}
