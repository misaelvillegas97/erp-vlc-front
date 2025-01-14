import { Component, forwardRef, OnDestroy, OnInit }                                  from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { HttpClient }                                                                from '@angular/common/http';

import { Subscription } from 'rxjs';

@Component({
    selector   : 'file-input',
    standalone : true,
    imports    : [ FormsModule, ReactiveFormsModule ],
    templateUrl: './file-input.component.html',
    providers  : [
        {
            provide    : NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => FileInputComponent),
            multi      : true
        }
    ]
})
export class FileInputComponent implements ControlValueAccessor, OnInit, OnDestroy {
    disabled: boolean = false;
    private fileSubscription: Subscription;

    constructor(private http: HttpClient) {}

    ngOnInit() {}

    ngOnDestroy() {
        if (this.fileSubscription) {
            this.fileSubscription.unsubscribe();
        }
    }

    writeValue(obj: any): void {

    }

    registerOnChange(fn: any): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: any): void {
        this.onTouched = fn;
    }

    setDisabledState?(isDisabled: boolean): void {
        this.disabled = isDisabled;
    }

    onFileSelected(event: any) {
        const file: File = event.target.files[0];
        if (file) {
            const formData = new FormData();
            formData.append('file', file, file.name);

            this.fileSubscription = this.http.post<{ id: string, filepath: string }>('/api/firebase/storage/upload', formData)
                .subscribe(response => {
                    this.onChange(response);
                    this.onTouched();
                });
        }
    }

    private onChange: (value: any) => void = () => {};

    private onTouched: () => void = () => {};
}
