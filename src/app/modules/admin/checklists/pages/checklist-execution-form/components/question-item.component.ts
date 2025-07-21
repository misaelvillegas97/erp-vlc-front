import { Component, input, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule }                                      from '@angular/common';
import { ReactiveFormsModule, ControlContainer }             from '@angular/forms';
import { MatFormFieldModule }                                from '@angular/material/form-field';
import { MatRadioModule }                                    from '@angular/material/radio';
import { MatInputModule }                                    from '@angular/material/input';
import { MatIconModule }                                     from '@angular/material/icon';
import { ChecklistQuestion }                                 from '../../../domain/interfaces/checklist-question.interface';
import { EvidenceUploadComponent }                           from './evidence-upload.component';

@Component({
    selector       : 'app-question-item',
    standalone     : true,
    imports        : [
        CommonModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatRadioModule,
        MatInputModule,
        MatIconModule,
        EvidenceUploadComponent
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl    : './question-item.component.html'
})
export class QuestionItemComponent {
    question = input.required<ChecklistQuestion>();
    required = input<boolean>(false);

    private controlContainer = inject(ControlContainer);

    get formGroup() {
        return this.controlContainer.control;
    }

    isCompleted(): boolean {
        const complianceStatus = this.formGroup?.get('complianceStatus')?.value;
        return !!complianceStatus;
    }
}
