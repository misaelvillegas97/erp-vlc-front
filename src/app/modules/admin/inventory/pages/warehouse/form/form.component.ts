import { Component, EventEmitter, inject, Input, OnInit, Output, signal } from '@angular/core';
import { CommonModule }                                                   from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators }        from '@angular/forms';
import { MatButtonModule }                                                from '@angular/material/button';
import { MatCardModule }                                                  from '@angular/material/card';
import { MatFormFieldModule }                                             from '@angular/material/form-field';
import { MatIconModule }                                                  from '@angular/material/icon';
import { MatInputModule }                                                 from '@angular/material/input';
import { MatSelectModule }                                                from '@angular/material/select';
import { MatSlideToggleModule }                                           from '@angular/material/slide-toggle';
import { MatTooltipModule }                                               from '@angular/material/tooltip';
import { MatProgressSpinner }                                             from '@angular/material/progress-spinner';
import { Warehouse }                                                      from '@modules/admin/inventory/domain/models/warehouse.model';

@Component({
    selector   : 'app-warehouse-form',
    standalone : true,
    imports    : [
        CommonModule,
        ReactiveFormsModule,
        MatButtonModule,
        MatCardModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        MatSelectModule,
        MatSlideToggleModule,
        MatTooltipModule,
        MatProgressSpinner
    ],
    templateUrl: './form.component.html'
})
export class WarehouseFormComponent implements OnInit {
    private readonly fb = inject(FormBuilder);

    @Input() warehouse: Warehouse | null = null;
    @Input() isLoading = false;
    @Output() formSubmit = new EventEmitter<Warehouse>();
    @Output() formCancel = new EventEmitter<void>();

    // Form
    warehouseForm: FormGroup = this.fb.group({
        name         : [ '', [ Validators.required, Validators.maxLength(100) ] ],
        description  : [ '', Validators.maxLength(500) ],
        address      : [ '', [ Validators.required, Validators.maxLength(200) ] ],
        contactPerson: [ '', Validators.maxLength(100) ],
        contactPhone : [ '', Validators.maxLength(20) ],
        contactEmail : [ '', [ Validators.email, Validators.maxLength(100) ] ],
        isActive     : [ true ]
    });

    formTitle = signal('Nuevo Almacén');

    ngOnInit(): void {
        if (this.warehouse) {
            this.formTitle.set('Editar Almacén');
            this.warehouseForm.patchValue({
                name         : this.warehouse.name,
                description  : this.warehouse.description || '',
                address      : this.warehouse.address,
                contactPerson: this.warehouse.contactPerson || '',
                contactPhone : this.warehouse.contactPhone || '',
                contactEmail : this.warehouse.contactEmail || '',
                isActive     : this.warehouse.isActive
            });
        }
    }

    onSubmit(): void {
        if (this.warehouseForm.invalid) {
            this.warehouseForm.markAllAsTouched();
            return;
        }

        const formValue = this.warehouseForm.getRawValue();
        const warehouseData: Warehouse = {
            id           : this.warehouse?.id || '',
            name         : formValue.name,
            description  : formValue.description || undefined,
            address      : formValue.address,
            contactPerson: formValue.contactPerson || undefined,
            contactPhone : formValue.contactPhone || undefined,
            contactEmail : formValue.contactEmail || undefined,
            isActive     : formValue.isActive
        };

        this.formSubmit.emit(warehouseData);
    }

    onCancel(): void {
        this.formCancel.emit();
    }

    resetForm(): void {
        if (this.warehouse) {
            this.warehouseForm.patchValue({
                name         : this.warehouse.name,
                description  : this.warehouse.description || '',
                address      : this.warehouse.address,
                contactPerson: this.warehouse.contactPerson || '',
                contactPhone : this.warehouse.contactPhone || '',
                contactEmail : this.warehouse.contactEmail || '',
                isActive     : this.warehouse.isActive
            });
        } else {
            this.warehouseForm.reset({
                name         : '',
                description  : '',
                address      : '',
                contactPerson: '',
                contactPhone : '',
                contactEmail : '',
                isActive     : true
            });
        }
    }
}
