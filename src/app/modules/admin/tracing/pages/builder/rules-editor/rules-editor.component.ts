import { Component, OnInit, inject, signal, ChangeDetectionStrategy }         from '@angular/core';
import { CommonModule }                                                       from '@angular/common';
import { RouterModule, ActivatedRoute }                                       from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { MatButtonModule }                                                    from '@angular/material/button';
import { MatCardModule }                                                      from '@angular/material/card';
import { MatFormFieldModule }                                                 from '@angular/material/form-field';
import { MatInputModule }                                                     from '@angular/material/input';
import { MatSelectModule }                                                    from '@angular/material/select';
import { MatIconModule }                                                      from '@angular/material/icon';
import { MatExpansionModule }                                                 from '@angular/material/expansion';
import { MatSnackBarModule, MatSnackBar }                                     from '@angular/material/snack-bar';
import { MatProgressSpinnerModule }                                           from '@angular/material/progress-spinner';

import { TracingApiService }            from '../../../services/tracing-api.service';
import { FlowVersion, TerminationRule } from '../../../models/entities';

@Component({
    selector       : 'app-rules-editor',
    standalone     : true,
    imports        : [
        CommonModule,
        RouterModule,
        ReactiveFormsModule,
        MatButtonModule,
        MatCardModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatIconModule,
        MatExpansionModule,
        MatSnackBarModule,
        MatProgressSpinnerModule
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template       : `
    <div class="rules-editor-container p-4 sm:p-6">
      <!-- Header -->
      <div class="flex justify-between items-center mb-6">
        <div class="flex items-center space-x-4">
          <button mat-icon-button [routerLink]="getBackRoute()" matTooltip="Volver">
            <mat-icon>arrow_back</mat-icon>
          </button>
          <div>
            <h1 class="text-2xl font-bold text-gray-900">Editor de Reglas de Terminación</h1>
            <p class="text-gray-600 mt-1">Configura automatizaciones y reglas de finalización</p>
          </div>
        </div>
        
        <button mat-raised-button color="primary" (click)="addRule()">
          <mat-icon>add</mat-icon>
          Nueva Regla
        </button>
      </div>

      <!-- Rules List -->
      <div class="space-y-4">
        @for (rule of rules(); track rule.id) {
          <mat-card class="rule-card">
            <mat-card-header>
              <mat-card-title>{{ rule.name || 'Regla sin nombre' }}</mat-card-title>
              <mat-card-subtitle>{{ rule.scope }} - {{ rule.when.event }}</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <p class="text-sm text-gray-600">{{ rule.description || 'Sin descripción' }}</p>
              <div class="mt-2">
                <strong>Condición:</strong> {{ rule.conditionExpr }}
              </div>
              <div class="mt-1">
                <strong>Acciones:</strong> {{ rule.actionsJson.length }} configuradas
              </div>
            </mat-card-content>
            <mat-card-actions>
              <button mat-button (click)="editRule(rule)">Editar</button>
              <button mat-button (click)="testRule(rule)">Probar</button>
              <button mat-button color="warn" (click)="deleteRule(rule)">Eliminar</button>
            </mat-card-actions>
          </mat-card>
        }
      </div>

      <!-- Empty State -->
      @if (rules().length === 0) {
        <div class="text-center py-12">
          <mat-icon class="text-6xl text-gray-400 mb-4">rule</mat-icon>
          <h3 class="text-xl font-medium text-gray-900 mb-2">No hay reglas configuradas</h3>
          <p class="text-gray-600 mb-6">Agrega reglas para automatizar acciones en tu flujo</p>
          <button mat-raised-button color="primary" (click)="addRule()">
            <mat-icon>add</mat-icon>
            Crear Primera Regla
          </button>
        </div>
      }
    </div>
  `,
    styles         : [ `
    .rules-editor-container {
      max-width: 1200px;
      margin: 0 auto;
    }
    .rule-card {
      transition: all 0.2s ease;
    }
    .rule-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
  ` ]
})
export class RulesEditorComponent implements OnInit {
    private readonly api = inject(TracingApiService);
    private readonly route = inject(ActivatedRoute);
    private readonly snackBar = inject(MatSnackBar);

    public readonly version = signal<FlowVersion | null>(null);
    public readonly rules = signal<TerminationRule[]>([]);
    public readonly isLoading = signal(false);

    private versionId: string = '';

    ngOnInit(): void {
        this.versionId = this.route.snapshot.paramMap.get('versionId') || '';
        this.loadRules();
    }

    private loadRules(): void {
        // TODO: Load actual rules from API
        const mockRules: TerminationRule[] = [
            {
                id           : 'rule-1',
                flowVersionId: this.versionId,
                scope        : 'STEP',
                when         : {event: 'onStepEnd', stepKey: 'verificacion'},
                conditionExpr: 'waste.totalQty > 0',
                actionsJson  : [
                    {type: 'SEND_EMAIL', to: [ 'qa@empresa.cl' ], subject: 'Mermas detectadas'}
                ],
                name         : 'Notificar Mermas',
                description  : 'Envía email cuando se detectan mermas',
                isActive     : true,
                createdAt    : new Date(),
                updatedAt    : new Date()
            }
        ];

        this.rules.set(mockRules);
    }

    public getBackRoute(): string {
        return `/tracing/builder/version/${ this.versionId }`;
    }

    public addRule(): void {
        this.snackBar.open('Editor de reglas próximamente', 'Cerrar', {duration: 3000});
    }

    public editRule(rule: TerminationRule): void {
        this.snackBar.open('Editor de reglas próximamente', 'Cerrar', {duration: 3000});
    }

    public testRule(rule: TerminationRule): void {
        this.snackBar.open('Testing de reglas próximamente', 'Cerrar', {duration: 3000});
    }

    public deleteRule(rule: TerminationRule): void {
        if (confirm('¿Estás seguro de eliminar esta regla?')) {
            const updatedRules = this.rules().filter(r => r.id !== rule.id);
            this.rules.set(updatedRules);
        }
    }
}
