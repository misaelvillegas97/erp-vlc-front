import { ChangeDetectionStrategy, Component, forwardRef, inject, input, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule }                                                                             from '@angular/common';
import {
    ControlValueAccessor,
    FormControl,
    FormsModule,
    NG_VALUE_ACCESSOR,
    ReactiveFormsModule,
    Validators
}                                                                                                   from '@angular/forms';
import {
    FloatLabelType,
    MatFormFieldModule,
    SubscriptSizing
}                                                                                                   from '@angular/material/form-field';
import { MatInputModule }                                                                           from '@angular/material/input';
import { MatIconModule }                                                                            from '@angular/material/icon';
import { Editor, NgxEditorModule, Toolbar }                                                         from 'ngx-editor';
import { Subject }                                                                                  from 'rxjs';
import { takeUntil }                                                                                from 'rxjs/operators';

@Component({
    selector       : 'rich-text-editor',
    standalone     : true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports        : [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatIconModule,
        NgxEditorModule
    ],
    providers      : [
        {
            provide    : NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => RichTextEditorComponent),
            multi      : true
        }
    ],
    template       : `
        <mat-label>{{ label() }}</mat-label>
        <div class="ngx-editor-wrapper">
            <ngx-editor-menu
                [editor]="editor()"
                [toolbar]="toolbar">
            </ngx-editor-menu>

            <ngx-editor
                [class]="controlClasses()"
                [editor]="editor()"
                [formControl]="editorControl"
                [placeholder]="placeholder()"
                (ngModelChange)="onContentChange($event)"
                (blur)="onBlur()">
            </ngx-editor>
        </div>

        @if (required() && editorControl.invalid && editorControl.touched) {
            <mat-error>{{ label() }} es requerido</mat-error>
        }
    `,
    styles         : [ `
        .ngx-editor-wrapper {
            width: 100%;
            border: 1px solid rgba(0, 0, 0, 0.12);
            border-radius: 4px;
            overflow: hidden;
        }

        .ngx-editor-wrapper:hover {
            border-color: rgba(0, 0, 0, 0.87);
        }

        .ngx-editor-wrapper:focus-within {
            border-color: #3f51b5;
            border-width: 2px;
        }

        ::ng-deep ngx-editor-menu {
            border-bottom: 1px solid rgba(0, 0, 0, 0.12);
        }

        ::ng-deep .NgxEditor {
            border: none !important;
        }

        ::ng-deep .NgxEditor__Content {
            min-height: 120px;
            max-height: 300px;
            overflow-y: auto;
        }

        ::ng-deep .ProseMirror {
            padding: 12px;
            outline: none;
        }

        ::ng-deep .ProseMirror p {
            margin: 0 0 8px 0;
        }

        ::ng-deep .ProseMirror p:last-child {
            margin-bottom: 0;
        }
    ` ]
})
export class RichTextEditorComponent implements ControlValueAccessor, OnInit, OnDestroy {
    private readonly destroy$ = new Subject<void>();

    // Inputs
    label = input<string>('Editor de texto');
    placeholder = input<string>('Escriba aquí...');
    floatLabel = input<FloatLabelType>('always');
    subscriptSizing = input<SubscriptSizing>('fixed');
    controlClasses = input<string>('');
    required = input<boolean>(false);
    minHeight = input<number>(120);
    maxHeight = input<number>(300);

    // State signals
    editor = signal<Editor | null>(null);
    editorControl = new FormControl<string>('');

    // Toolbar configuration
    toolbar: Toolbar = [
        [ 'bold', 'italic', 'underline', 'strike' ],
        [ 'blockquote', 'code' ],
        [ 'ordered_list', 'bullet_list' ],
        [ {heading: [ 'h1', 'h2', 'h3', 'h4', 'h5', 'h6' ]} ],
        [ 'link', 'image' ],
        [ 'text_color', 'background_color' ],
        [ 'align_left', 'align_center', 'align_right', 'align_justify' ],
        [ 'horizontal_rule', 'format_clear' ],
        [ 'undo', 'redo' ]
    ];

    // ControlValueAccessor implementation
    private onChange: (value: string) => void = () => {};
    private onTouched: () => void = () => {};

    ngOnInit(): void {
        // Initialize the editor
        const editorInstance = new Editor();
        this.editor.set(editorInstance);

        // Set validators if required
        if (this.required()) {
            this.editorControl.setValidators([ Validators.required ]);
            this.editorControl.updateValueAndValidity();
        }

        // Listen to editor content changes
        this.editorControl.valueChanges.pipe(
            takeUntil(this.destroy$)
        ).subscribe(value => {
            this.onChange(value || '');
        });
    }

    ngOnDestroy(): void {
        const editorInstance = this.editor();
        if (editorInstance) {
            editorInstance.destroy();
        }
        this.destroy$.next();
        this.destroy$.complete();
    }

    onContentChange(content: string): void {
        // This method is called when the editor content changes
        // The FormControl valueChanges subscription will handle the onChange call
    }

    onBlur(): void {
        this.onTouched();
    }

    // ControlValueAccessor methods
    writeValue(value: string): void {
        this.editorControl.setValue(value || '', {emitEvent: false});
    }

    registerOnChange(fn: (value: string) => void): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: () => void): void {
        this.onTouched = fn;
    }

    setDisabledState(isDisabled: boolean): void {
        if (isDisabled) {
            this.editorControl.disable();
        } else {
            this.editorControl.enable();
        }
    }
}
