import { ChangeDetectionStrategy, Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule }                                                         from '@angular/common';
import { Router, ActivatedRoute }                                               from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule }              from '@angular/forms';
import { MatButtonModule }                                                      from '@angular/material/button';
import { MatCardModule }                                                        from '@angular/material/card';
import { MatCheckboxModule }                                                    from '@angular/material/checkbox';
import { MatDatepickerModule }                                                  from '@angular/material/datepicker';
import { MatNativeDateModule }                                                  from '@angular/material/core';
import { MatDialogModule, MatDialog }                                           from '@angular/material/dialog';
import { MatFormFieldModule }                                                   from '@angular/material/form-field';
import { MatIconModule }                                                        from '@angular/material/icon';
import { MatInputModule }                                                       from '@angular/material/input';
import { MatProgressSpinnerModule }                                             from '@angular/material/progress-spinner';
import { MatSelectModule }                                                      from '@angular/material/select';
import { MatStepperModule }                                                     from '@angular/material/stepper';
import { MatTooltipModule }                                                     from '@angular/material/tooltip';
import { MatChipsModule }                                                       from '@angular/material/chips';
import { PageHeaderComponent }                                                  from '@layout/components/page-header/page-header.component';
import { NotyfService }                                                         from '@shared/services/notyf.service';

import { ProcedureStore }                            from '../../store/procedure.store';
import { PublicationsService, CreatePublicationDto } from '../../services/publications.service';
import { ProcedureVersion }                          from '../../domain/interfaces';
import { AudienceType, Channel }                     from '../../domain/enums';

@Component({
    selector       : 'app-procedure-publish',
    standalone     : true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports        : [
        CommonModule,
        ReactiveFormsModule,
        PageHeaderComponent,
        MatButtonModule,
        MatCardModule,
        MatCheckboxModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatDialogModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        MatProgressSpinnerModule,
        MatSelectModule,
        MatStepperModule,
        MatTooltipModule,
        MatChipsModule
    ],
    template       : `
        <div class="flex flex-col min-w-0 w-full">
            <page-header
                title="Publicar Procedimiento"
                [subtitle]="'Configurar y publicar: ' + (selectedProcedure()?.title || '')"
                icon="heroicons_outline:megaphone">
            </page-header>

            <div class="grid grid-cols-1 md:grid-cols-12 gap-6 w-full p-6">
                <!-- Formulario principal -->
                <div class="md:col-span-8">
                    <!-- Legal Notice Warning -->
                    @if (currentVersion()?.modifiesInternalRegulations) {
                        <mat-card class="mb-6 border-l-4 border-red-500">
                            <mat-card-content class="pt-4">
                                <div class="flex items-start">
                                    <mat-icon class="text-red-500 mr-3">warning</mat-icon>
                                    <div>
                                        <h3 class="text-lg font-semibold text-red-800 mb-2">Legal Compliance Required</h3>
                                        <p class="text-sm text-red-700 mb-3">
                                            This procedure modifies Internal Regulations. Chilean Labor Code requires:
                                        </p>
                                        <ul class="text-sm text-red-700 list-disc ml-4 mb-3">
                                            <li>30-day advance notice before implementation</li>
                                            <li>Posted in at least two visible locations</li>
                                            <li>Copy delivered to unions and Comité Paritario</li>
                                            <li>Evidence of compliance must be uploaded</li>
                                        </ul>
                                        <p class="text-xs text-red-600">
                                            Reference: Chilean Labor Code Articles 153 and 156
                                        </p>
                                    </div>
                                </div>
                            </mat-card-content>
                        </mat-card>
                    }

                    <!-- Publication Wizard -->
                    <mat-card>
                        <mat-card-content class="p-0">
                            <mat-stepper [linear]="true" #stepper>
                                <!-- Step 1: Audience -->
                                <mat-step [stepControl]="audienceForm" label="Audiencia Objetivo">
                                    <form [formGroup]="audienceForm" class="p-6">
                                        <h3 class="text-lg font-semibold mb-4">Seleccionar Audiencia Objetivo</h3>

                                        <mat-form-field class="w-full mb-4">
                                            <mat-label>Tipo de Audiencia</mat-label>
                                            <mat-select formControlName="audienceType" required>
                                                <mat-option value="all">Todos los Empleados</mat-option>
                                                <mat-option value="roles">Roles Específicos</mat-option>
                                                <mat-option value="groups">Grupos de Trabajo</mat-option>
                                                <mat-option value="users">Usuarios Individuales</mat-option>
                                            </mat-select>
                                        </mat-form-field>

                                        @if (audienceForm.get('audienceType')?.value !== 'all') {
                                            <mat-form-field class="w-full mb-4">
                                                <mat-label>Seleccionar {{ getAudienceLabel() }}</mat-label>
                                                <mat-select formControlName="audienceIds" multiple required>
                                                    @for (option of getAudienceOptions(); track option.id) {
                                                        <mat-option [value]="option.id">{{ option.name }}</mat-option>
                                                    }
                                                </mat-select>
                                            </mat-form-field>
                                        }

                                        <mat-form-field class="w-full">
                                            <mat-label>Canales de Distribución</mat-label>
                                            <mat-select formControlName="channels" multiple required>
                                                <mat-option value="inapp">Notificación Interna</mat-option>
                                                <mat-option value="email">Email</mat-option>
                                                <mat-option value="whatsapp">WhatsApp (si está disponible)</mat-option>
                                            </mat-select>
                                        </mat-form-field>

                                        <div class="flex justify-end mt-6">
                                            <button mat-raised-button color="primary" matStepperNext
                                                    [disabled]="!audienceForm.valid">
                                                Siguiente
                                            </button>
                                        </div>
                                    </form>
                                </mat-step>

                                <!-- Step 2: Schedule & Validity -->
                                <mat-step [stepControl]="scheduleForm" label="Programación y Vigencia">
                                    <form [formGroup]="scheduleForm" class="p-6">
                                        <h3 class="text-lg font-semibold mb-4">Programación de Publicación</h3>

                                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                            <mat-form-field>
                                                <mat-label>Válido Desde</mat-label>
                                                <input matInput [matDatepicker]="validFromPicker"
                                                       formControlName="validFrom"
                                                       [min]="getMinValidFromDate()">
                                                <mat-datepicker-toggle matSuffix [for]="validFromPicker"></mat-datepicker-toggle>
                                                <mat-datepicker #validFromPicker></mat-datepicker>
                                                @if (currentVersion()?.modifiesInternalRegulations) {
                                                    <mat-hint>Debe ser al menos 30 días desde hoy</mat-hint>
                                                }
                                            </mat-form-field>

                                            <mat-form-field>
                                                <mat-label>Válido Hasta (Opcional)</mat-label>
                                                <input matInput [matDatepicker]="validUntilPicker"
                                                       formControlName="validUntil"
                                                       [min]="scheduleForm.get('validFrom')?.value">
                                                <mat-datepicker-toggle matSuffix [for]="validUntilPicker"></mat-datepicker-toggle>
                                                <mat-datepicker #validUntilPicker></mat-datepicker>
                                            </mat-form-field>
                                        </div>

                                        @if (currentVersion()?.modifiesInternalRegulations) {
                                            <mat-card class="mb-4 bg-amber-50">
                                                <mat-card-content class="pt-4">
                                                    <h4 class="font-medium text-amber-800 mb-2">Período de Aviso de 30 Días</h4>
                                                    <p class="text-sm text-amber-700 mb-2">
                                                        Período de pre-aviso: {{ getPreNoticeStart() | date:'mediumDate' }} a {{ scheduleForm.get('validFrom')?.value | date:'mediumDate' }}
                                                    </p>
                                                    <p class="text-xs text-amber-600">
                                                        Durante este período, se notificará a los empleados sobre los próximos cambios.
                                                    </p>
                                                </mat-card-content>
                                            </mat-card>
                                        }

                                        <mat-form-field class="w-full">
                                            <mat-label>Mensaje de Publicación (Opcional)</mat-label>
                                            <textarea matInput formControlName="message"
                                                      placeholder="Agregue un mensaje para acompañar esta publicación..."
                                                      rows="3"></textarea>
                                        </mat-form-field>

                                        <div class="flex justify-between mt-6">
                                            <button mat-button matStepperPrevious>Anterior</button>
                                            <button mat-raised-button color="primary" matStepperNext
                                                    [disabled]="!scheduleForm.valid">
                                                Siguiente
                                            </button>
                                        </div>
                                    </form>
                                </mat-step>

                                <!-- Step 3: Legal Compliance (if applicable) -->
                                @if (currentVersion()?.modifiesInternalRegulations) {
                                    <mat-step [stepControl]="complianceForm" label="Cumplimiento Legal">
                                        <div class="p-6">
                                            <h3 class="text-lg font-semibold mb-4">Evidencia de Cumplimiento</h3>
                                            <p class="text-sm text-gray-600 mb-6">
                                                Sube evidencia del cumplimiento de los requisitos del Código del Trabajo chileno:
                                            </p>

                                            <div class="space-y-4">
                                                <div class="p-4 border border-gray-200 rounded-lg">
                                                    <div class="flex items-center justify-between mb-2">
                                                        <h4 class="font-medium">Revisión Comité Paritario</h4>
                                                        <span class="text-sm px-2 py-1 rounded"
                                                              [class]="hasComiteParitarioReview() ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'">
                                                                {{ hasComiteParitarioReview() ? 'Completado' : 'Requerido' }}
                                                            </span>
                                                    </div>
                                                    <p class="text-sm text-gray-600 mb-3">
                                                        El Comité Paritario debe revisar y aprobar los cambios al reglamento interno.
                                                    </p>
                                                    <button mat-button color="primary" (click)="uploadComiteEvidence()">
                                                        <mat-icon>upload_file</mat-icon>
                                                        Subir Actas de Revisión
                                                    </button>
                                                </div>

                                                <div class="p-4 border border-gray-200 rounded-lg">
                                                    <div class="flex items-center justify-between mb-2">
                                                        <h4 class="font-medium">Publicación Visible</h4>
                                                        <span class="text-sm px-2 py-1 rounded"
                                                              [class]="hasVisiblePosting() ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'">
                                                                {{ hasVisiblePosting() ? 'Completado' : 'Pendiente' }}
                                                            </span>
                                                    </div>
                                                    <p class="text-sm text-gray-600 mb-3">
                                                        Publicar aviso en al menos dos ubicaciones visibles (después del aviso de 30 días).
                                                    </p>
                                                    <button mat-button (click)="uploadPostingEvidence()"
                                                            [disabled]="!canUploadPosting()">
                                                        <mat-icon>upload_file</mat-icon>
                                                        Subir Fotos de Publicación
                                                    </button>
                                                </div>

                                                <div class="p-4 border border-gray-200 rounded-lg">
                                                    <div class="flex items-center justify-between mb-2">
                                                        <h4 class="font-medium">Entrega a Sindicatos y CP</h4>
                                                        <span class="text-sm px-2 py-1 rounded"
                                                              [class]="hasUnionDelivery() ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'">
                                                                {{ hasUnionDelivery() ? 'Completado' : 'Pendiente' }}
                                                            </span>
                                                    </div>
                                                    <p class="text-sm text-gray-600 mb-3">
                                                        Entregar copias a sindicatos y Comité Paritario.
                                                    </p>
                                                    <button mat-button (click)="uploadDeliveryEvidence()"
                                                            [disabled]="!canUploadDelivery()">
                                                        <mat-icon>upload_file</mat-icon>
                                                        Subir Recibos de Entrega
                                                    </button>
                                                </div>
                                            </div>

                                            <div class="flex justify-between mt-6">
                                                <button mat-button matStepperPrevious>Anterior</button>
                                                <button mat-raised-button color="primary" matStepperNext>
                                                    Siguiente
                                                </button>
                                            </div>
                                        </div>
                                    </mat-step>
                                }

                                <!-- Step 4: Review & Publish -->
                                <mat-step label="Revisar y Publicar">
                                    <div class="p-6">
                                        <h3 class="text-lg font-semibold mb-4">Revisar Publicación</h3>

                                        <!-- Publication Summary -->
                                        <mat-card class="mb-6">
                                            <mat-card-header>
                                                <mat-card-title>Resumen de Publicación</mat-card-title>
                                            </mat-card-header>
                                            <mat-card-content class="pt-4">
                                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <h5 class="font-medium text-gray-600 mb-1">Procedimiento</h5>
                                                        <p>{{ selectedProcedure()?.title }}</p>
                                                        <p class="text-sm text-gray-500">Versión {{ currentVersion()?.version }}</p>
                                                    </div>
                                                    <div>
                                                        <h5 class="font-medium text-gray-600 mb-1">Audiencia</h5>
                                                        <p>{{ getAudienceSummary() }}</p>
                                                    </div>
                                                    <div>
                                                        <h5 class="font-medium text-gray-600 mb-1">Válido Desde</h5>
                                                        <p>{{ scheduleForm.get('validFrom')?.value | date:'mediumDate' }}</p>
                                                    </div>
                                                    <div>
                                                        <h5 class="font-medium text-gray-600 mb-1">Distribución</h5>
                                                        <p>{{ getChannelsSummary() }}</p>
                                                    </div>
                                                </div>
                                            </mat-card-content>
                                        </mat-card>

                                        <!-- Legal Requirements Status -->
                                        @if (currentVersion()?.modifiesInternalRegulations) {
                                            <mat-card class="mb-6">
                                                <mat-card-header>
                                                    <mat-card-title>Estado de Cumplimiento Legal</mat-card-title>
                                                </mat-card-header>
                                                <mat-card-content class="pt-4">
                                                    <div class="space-y-2">
                                                        <div class="flex items-center">
                                                            <mat-icon [class]="hasComiteParitarioReview() ? 'text-green-500' : 'text-red-500'" class="mr-2">
                                                                {{ hasComiteParitarioReview() ? 'check_circle' : 'error' }}
                                                            </mat-icon>
                                                            <span>Revisión Comité Paritario</span>
                                                        </div>
                                                        <div class="flex items-center">
                                                            <mat-icon class="text-blue-500 mr-2">schedule</mat-icon>
                                                            <span>Período de Aviso de 30 días: {{ getPreNoticeStart() | date:'mediumDate' }} - {{ scheduleForm.get('validFrom')?.value | date:'mediumDate' }}</span>
                                                        </div>
                                                    </div>
                                                </mat-card-content>
                                            </mat-card>
                                        }

                                        <div class="flex justify-between">
                                            <button mat-button matStepperPrevious>Anterior</button>
                                            <button mat-raised-button color="primary"
                                                    (click)="publishProcedure()"
                                                    [disabled]="!canPublish() || isPublishing()">
                                                @if (isPublishing()) {
                                                    <mat-progress-spinner diameter="16" class="mr-2"></mat-progress-spinner>
                                                }
                                                Publicar Procedimiento
                                            </button>
                                        </div>
                                    </div>
                                </mat-step>
                            </mat-stepper>
                        </mat-card-content>
                    </mat-card>
                </div>

                <!-- Panel de información lateral -->
                <div class="md:col-span-4 flex flex-col gap-6">
                    <!-- Información general -->
                    <mat-card class="rounded-md shadow">
                        <mat-card-content>
                            <h2 class="text-xl font-medium mb-4 flex items-center">
                                <mat-icon svgIcon="mat_solid:info"></mat-icon>
                                <span class="ml-2">Información</span>
                            </h2>
                            <div class="text-gray-700 dark:text-gray-300 space-y-3">
                                <p>La publicación configura cómo y cuándo se distribuye el procedimiento a los empleados.</p>
                                <p><strong>Audiencia:</strong> Seleccione quién recibirá la notificación del procedimiento.</p>
                                <p><strong>Canales:</strong> Configure los medios de distribución (notificación interna, email, WhatsApp).</p>
                            </div>
                        </mat-card-content>
                    </mat-card>

                    <!-- Consejos -->
                    <mat-card class="rounded-md shadow">
                        <mat-card-content>
                            <h2 class="text-xl font-medium mb-4 flex items-center">
                                <mat-icon svgIcon="mat_solid:tips_and_updates"></mat-icon>
                                <span class="ml-2">Consejos</span>
                            </h2>
                            <div class="text-gray-700 dark:text-gray-300 space-y-3">
                                <p><strong>Fecha de Vigencia:</strong> Configure cuándo el procedimiento será efectivo.</p>
                                <p><strong>Cumplimiento Legal:</strong> Para procedimientos que modifican el reglamento interno, se requiere periodo de aviso de 30 días.</p>
                                <p><strong>Evidencia:</strong> Suba evidencia de cumplimiento de requisitos legales cuando sea necesario.</p>
                            </div>
                        </mat-card-content>
                    </mat-card>

                    <!-- Estado del procedimiento -->
                    @if (selectedProcedure()) {
                        <mat-card class="rounded-md shadow">
                            <mat-card-content>
                                <h2 class="text-xl font-medium mb-4 flex items-center">
                                    <mat-icon svgIcon="mat_solid:assignment"></mat-icon>
                                    <span class="ml-2">Estado del Procedimiento</span>
                                </h2>
                                <div class="text-gray-700 dark:text-gray-300 space-y-3">
                                    <p><strong>Procedimiento:</strong> {{ selectedProcedure()?.title }}</p>
                                    @if (currentVersion()) {
                                        <p><strong>Versión:</strong> {{ currentVersion()?.version }}</p>
                                        <p><strong>Autor:</strong> {{ currentVersion()?.author }}</p>
                                        @if (currentVersion()?.modifiesInternalRegulations) {
                                            <div class="p-2 bg-amber-50 rounded-md border border-amber-200">
                                                <p class="text-sm text-amber-800">
                                                    <mat-icon class="text-amber-600 text-sm mr-1">warning</mat-icon>
                                                    Modifica Reglamento Interno
                                                </p>
                                            </div>
                                        }
                                    }
                                </div>
                            </mat-card-content>
                        </mat-card>
                    }

                    <!-- Progreso de cumplimiento -->
                    @if (currentVersion()?.modifiesInternalRegulations) {
                        <mat-card class="rounded-md shadow">
                            <mat-card-content>
                                <h2 class="text-xl font-medium mb-4 flex items-center">
                                    <mat-icon svgIcon="mat_solid:checklist"></mat-icon>
                                    <span class="ml-2">Cumplimiento Legal</span>
                                </h2>
                                <div class="text-gray-700 dark:text-gray-300 space-y-3">
                                    <div class="flex items-center">
                                        <mat-icon [class]="hasComiteParitarioReview() ? 'text-green-500' : 'text-gray-400'" class="mr-2">
                                            {{ hasComiteParitarioReview() ? 'check_circle' : 'radio_button_unchecked' }}
                                        </mat-icon>
                                        <span class="text-sm">Revisión Comité Paritario</span>
                                    </div>
                                    <div class="flex items-center">
                                        <mat-icon [class]="hasVisiblePosting() ? 'text-green-500' : 'text-gray-400'" class="mr-2">
                                            {{ hasVisiblePosting() ? 'check_circle' : 'radio_button_unchecked' }}
                                        </mat-icon>
                                        <span class="text-sm">Publicación Visible</span>
                                    </div>
                                    <div class="flex items-center">
                                        <mat-icon [class]="hasUnionDelivery() ? 'text-green-500' : 'text-gray-400'" class="mr-2">
                                            {{ hasUnionDelivery() ? 'check_circle' : 'radio_button_unchecked' }}
                                        </mat-icon>
                                        <span class="text-sm">Entrega a Sindicatos</span>
                                    </div>
                                </div>
                            </mat-card-content>
                        </mat-card>
                    }
                </div>
            </div>
        </div>
    `
})
export class ProcedurePublishComponent implements OnInit {
    private store = inject(ProcedureStore);
    private publicationsService = inject(PublicationsService);
    private router = inject(Router);
    private route = inject(ActivatedRoute);
    private fb = inject(FormBuilder);
    private dialog = inject(MatDialog);
    private notyf = inject(NotyfService);

    // Form groups
    audienceForm = this.fb.group({
        audienceType: [ 'all', Validators.required ],
        audienceIds : [ [] ],
        channels    : [ [ 'inapp' ], Validators.required ]
    });

    scheduleForm = this.fb.group({
        validFrom : [ new Date(), Validators.required ],
        validUntil: [ null ],
        message   : [ '' ]
    });

    complianceForm = this.fb.group({
        // Compliance evidence will be tracked via separate signals
    });

    // State signals
    isPublishing = signal(false);
    complianceEvidence = signal({
        comiteParitarioReview: false,
        visiblePosting       : false,
        unionDelivery        : false
    });

    // Store signals
    selectedProcedure = this.store.selectedProcedure;
    currentVersion = this.store.currentVersion;

    // Mock data - in real app, these would come from services
    mockAudienceOptions = {
        roles : [
            {id: 'manager', name: 'Managers'},
            {id: 'supervisor', name: 'Supervisors'},
            {id: 'operator', name: 'Operators'}
        ],
        groups: [
            {id: 'production', name: 'Production Team'},
            {id: 'maintenance', name: 'Maintenance Team'},
            {id: 'safety', name: 'Safety Team'}
        ],
        users : [
            {id: 'user1', name: 'Juan Pérez'},
            {id: 'user2', name: 'María González'}
        ]
    };

    ngOnInit(): void {
        this.route.params.subscribe(params => {
            if (params['id']) {
                this.store.selectProcedure(params['id']);
            }
        });

        // Set minimum date for legal compliance
        if (this.currentVersion()?.modifiesInternalRegulations) {
            const minDate = new Date();
            minDate.setDate(minDate.getDate() + 30);
            this.scheduleForm.patchValue({validFrom: minDate});
        }
    }

    getMinValidFromDate(): Date {
        if (this.currentVersion()?.modifiesInternalRegulations) {
            const date = new Date();
            date.setDate(date.getDate() + 30);
            return date;
        }
        return new Date();
    }

    getPreNoticeStart(): Date {
        const validFrom = this.scheduleForm.get('validFrom')?.value;
        if (validFrom) {
            const preNotice = new Date(validFrom);
            preNotice.setDate(preNotice.getDate() - 30);
            return preNotice;
        }
        return new Date();
    }

    getAudienceLabel(): string {
        const type = this.audienceForm.get('audienceType')?.value;
        switch (type) {
            case 'roles':
                return 'Roles';
            case 'groups':
                return 'Grupos';
            case 'users':
                return 'Usuarios';
            default:
                return '';
        }
    }

    getAudienceOptions(): Array<{ id: string, name: string }> {
        const type = this.audienceForm.get('audienceType')?.value as keyof typeof this.mockAudienceOptions;
        return this.mockAudienceOptions[type] || [];
    }

    getAudienceSummary(): string {
        const type = this.audienceForm.get('audienceType')?.value;
        if (type === 'all') return 'Todos los Empleados';

        const ids = this.audienceForm.get('audienceIds')?.value || [];
        const options = this.getAudienceOptions();
        const names = options.filter(o => ids.includes(o.id)).map(o => o.name);

        return names.length > 0 ? names.join(', ') : 'Ninguno seleccionado';
    }

    getChannelsSummary(): string {
        const channels = this.audienceForm.get('channels')?.value || [];
        const channelNames: Record<string, string> = {
            'inapp'   : 'Notificación Interna',
            'email'   : 'Email',
            'whatsapp': 'WhatsApp'
        };

        return channels.map((c: string) => channelNames[c] || c).join(', ');
    }

    // Compliance evidence methods
    hasComiteParitarioReview(): boolean {
        return this.complianceEvidence().comiteParitarioReview;
    }

    hasVisiblePosting(): boolean {
        return this.complianceEvidence().visiblePosting;
    }

    hasUnionDelivery(): boolean {
        return this.complianceEvidence().unionDelivery;
    }

    canUploadPosting(): boolean {
        // Can only upload posting evidence after the pre-notice period
        const validFrom = this.scheduleForm.get('validFrom')?.value;
        if (!validFrom) return false;

        const preNoticeEnd = new Date(validFrom);
        return new Date() >= preNoticeEnd;
    }

    canUploadDelivery(): boolean {
        return this.canUploadPosting(); // Same logic for now
    }

    uploadComiteEvidence(): void {
        // TODO: Implement file upload dialog
        this.complianceEvidence.update(evidence => ({
            ...evidence,
            comiteParitarioReview: true
        }));
    }

    uploadPostingEvidence(): void {
        // TODO: Implement file upload dialog
        this.complianceEvidence.update(evidence => ({
            ...evidence,
            visiblePosting: true
        }));
    }

    uploadDeliveryEvidence(): void {
        // TODO: Implement file upload dialog
        this.complianceEvidence.update(evidence => ({
            ...evidence,
            unionDelivery: true
        }));
    }

    canPublish(): boolean {
        if (!this.audienceForm.valid || !this.scheduleForm.valid) return false;

        if (this.currentVersion()?.modifiesInternalRegulations) {
            return this.hasComiteParitarioReview();
        }

        return true;
    }

    async publishProcedure(): Promise<void> {
        if (!this.canPublish()) return;

        const version = this.currentVersion();
        if (!version) return;

        this.isPublishing.set(true);

        try {
            const dto: CreatePublicationDto = {
                versionId                  : version.id,
                audienceType               : this.audienceForm.get('audienceType')?.value as AudienceType,
                audienceIds                : this.audienceForm.get('audienceIds')?.value || [],
                channels                   : this.audienceForm.get('channels')?.value?.map((c: string) => c as Channel) || [],
                validFrom                  : this.scheduleForm.get('validFrom')?.value,
                validUntil                 : this.scheduleForm.get('validUntil')?.value,
                message                    : this.scheduleForm.get('message')?.value || undefined,
                modifiesInternalRegulations: version.modifiesInternalRegulations
            };

            await this.publicationsService.createPublication(dto).toPromise();

            // Navigate back to procedure list
            this.router.navigate([ '../list' ], {relativeTo: this.route});
        } finally {
            this.isPublishing.set(false);
        }
    }

    goBack(): void {
        this.router.navigate([ '../list' ], {relativeTo: this.route});
    }
}
