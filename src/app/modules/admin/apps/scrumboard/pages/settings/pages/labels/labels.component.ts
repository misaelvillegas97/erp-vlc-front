import { AsyncPipe }                                                             from '@angular/common';
import { Component, computed, inject, signal }                                   from '@angular/core';
import { ReactiveFormsModule, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatButton, MatIconButton }                                              from '@angular/material/button';
import { MatError, MatFormField, MatLabel }                                      from '@angular/material/form-field';
import { MatIcon }                                                               from '@angular/material/icon';
import { MatInput }                                                              from '@angular/material/input';
import { MatTooltip }                                                            from '@angular/material/tooltip';

import { TranslocoPipe }                   from '@ngneat/transloco';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { Label }                           from '@modules/admin/apps/scrumboard/models/scrumboard.models';
import { ScrumboardService }               from '@modules/admin/apps/scrumboard/services/scrumboard.service';

@Component({
    selector   : 'app-labels',
    standalone : true,
    imports: [
        ReactiveFormsModule,
        MatFormField,
        MatInput,
        MatIcon,
        MatButton,
        TranslocoPipe,
        MatTooltip,
        AsyncPipe,
        MatIconButton,
        MatLabel,
        MatError
    ],
    templateUrl: './labels.component.html'
})
export class LabelsComponent {
    readonly #boardService = inject(ScrumboardService);
    readonly #fb = inject(UntypedFormBuilder);

    board = this.#boardService.board;
    deleting$: BehaviorSubject<boolean> = new BehaviorSubject(false);

    colors: string[] = [
        '#f44336', // Red
        '#e91e63', // Pink
        '#9c27b0', // Purple
        '#673ab7', // Deep Purple
        '#3f51b5', // Indigo
        '#2196f3', // Blue
        '#03a9f4', // Light Blue
        '#00bcd4', // Cyan
        '#009688', // Teal
        '#4caf50', // Green
        '#8bc34a', // Light Green
        '#cddc39', // Lime
        '#ffeb3b', // Yellow
        '#ffc107', // Amber
        '#ff9800', // Orange
        '#ff5722'  // Deep Orange
    ];

    form: UntypedFormGroup = this.#fb.group({
        title: [ '', Validators.required ],
        color: [ this.colors[0], Validators.required ],
    });

    selectedColor = signal<string>(this.colors[0]);

    contrastColor = computed(() => {
        return this.getContrastYIQ(this.selectedColor());
    });

    selectColor(color: string) {
        this.selectedColor.set(color);
        this.form.patchValue({color: color});
    }

    submit() {
        if (this.form.invalid) return;

        this.form.disable();

        const selectedColor = this.selectedColor();
        const formValue = this.form.getRawValue();

        formValue.color = selectedColor;

        firstValueFrom(this.#boardService.addLabel(this.board().id, formValue))
            .then(() => this.form.reset())
            .finally(() => this.form.enable());
    }

    remove(label: Label) {
        this.deleting$.next(true);

        firstValueFrom(this.#boardService.removeLabel(this.board().id, label.id))
            .then(() => {
                this.board().labels = this.board().labels.filter(l => l.id !== label.id);
                this.deleting$.next(false);
            })
            .catch(() => {
                this.deleting$.next(false);
            });
    }

    getContrastYIQ(hexcolor: string): string {
        // If the color doesn't start with #, return black
        if (!hexcolor.startsWith('#')) {
            console.log('Invalid color format, must start with #');
            return '#000000';
        }

        // Remove the # if it exists
        hexcolor = hexcolor.replace('#', '');

        // Convert to RGB
        const r = parseInt(hexcolor.substr(0, 2), 16);
        const g = parseInt(hexcolor.substr(2, 2), 16);
        const b = parseInt(hexcolor.substr(4, 2), 16);

        // Calculate YIQ
        const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;

        // Return black or white depending on the YIQ value
        return (yiq >= 128) ? '#000000' : '#ffffff';
    }
}
