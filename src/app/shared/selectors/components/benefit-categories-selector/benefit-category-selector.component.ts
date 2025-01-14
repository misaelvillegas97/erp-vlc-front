import { Component, forwardRef, Input, OnDestroy, OnInit }                                  from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, ReactiveFormsModule, UntypedFormControl } from '@angular/forms';
import { MatOptionModule }                                                                  from '@angular/material/core';
import { MatFormFieldModule, MatLabel }                                                     from '@angular/material/form-field';
import { MatSelectModule }                                                                  from '@angular/material/select';

import { TranslocoDirective, TranslocoPipe } from '@ngneat/transloco';
import { BehaviorSubject, firstValueFrom }   from 'rxjs';

import { LayoutEnum }                              from '@core/enums/layout.enum';
import { BenefitCategoryService }                  from '@modules/admin/admin/benefits/services/benefit-category.service';
import { Selector }                                from '../../model/selector';
import { AsyncPipe, NgForOf }                      from '@angular/common';
import { MatAutocomplete, MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { MatIcon }                                 from '@angular/material/icon';
import { MatIconButton }                           from '@angular/material/button';
import { MatInput }                                from '@angular/material/input';
import { displayWithFn, filterByValue }            from '@core/utils';
import { MatProgressSpinner }                      from '@angular/material/progress-spinner';
import { BenefitCategoryMapper }                   from '@modules/admin/admin/benefits/models/benefit-category';

@Component({
    selector   : 'benefit-category-selector',
    templateUrl: './benefit-category-selector.component.html',
    standalone : true,
    imports    : [
        MatFormFieldModule,
        MatSelectModule,
        MatOptionModule,
        MatLabel,
        TranslocoPipe,
        MatAutocomplete,
        NgForOf,
        MatAutocompleteTrigger,
        MatIcon,
        MatIconButton,
        MatInput,
        ReactiveFormsModule,
        MatProgressSpinner,
        TranslocoDirective,
        AsyncPipe
    ],
    providers  : [
        {
            provide    : NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => BenefitCategorySelector),
            multi      : true
        }
    ]
})
export class BenefitCategorySelector implements ControlValueAccessor, OnInit, OnDestroy {
    @Input() formControl: UntypedFormControl;
    @Input() filterParent: boolean = false;
    categories: Selector[];
    loading: boolean = true;
    error: any;
    selectedCategory: any;
    protected readonly displayCategoryWithFn = displayWithFn<Selector>;
    private _unsubscribeAll: BehaviorSubject<any> = new BehaviorSubject<any>(null);

    constructor(private readonly _benefitCategoryService: BenefitCategoryService) {
        firstValueFrom(this._benefitCategoryService.findAll(LayoutEnum.SELECTOR))
            .then()
            .catch(error => {
                console.error('Error fetching categories:', error);
                this.loading = false;
                this.error = error;
            });
    }

    private _categoriesFiltered$: BehaviorSubject<Selector[]> = new BehaviorSubject<Selector[]>([]);

    get categoriesFiltered$() {
        return this._categoriesFiltered$.asObservable();
    }

    ngOnInit() {
        this._benefitCategoryService.findAll(LayoutEnum.SELECTOR)
            .subscribe(categories => {
                // remove categories that have parent
                const categoriesFiltered = this.filterParent ? categories.filter(category => !category.parent) : categories;

                this.loading = false;
                this.categories = categoriesFiltered.map(BenefitCategoryMapper.toSelector);
                this._categoriesFiltered$.next(this.categories);
            });
    }

    ngOnDestroy() {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    filter(target: any) {
        const filterValue = target.value;
        if (!filterValue) {
            this._categoriesFiltered$.next(this.categories);
            return;
        }

        const filtered = filterByValue(this.categories, filterValue, 'label');
        this._categoriesFiltered$.next(filtered);
    }

    // ControlValueAccessor interface methods
    writeValue(obj: any): void {
        this.selectedCategory = obj;
    }

    registerOnChange(fn: any): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: any): void {
        this.onTouched = fn;
    }

    setDisabledState?(isDisabled: boolean): void {
        // Implement if needed
    }

    onChange: any = () => {};
    onTouched: any = () => {};

    onCategoryChange(event: any) {
        if (!event) {
            this.selectedCategory = undefined;
            this.onChange(undefined);
        } else {
            const selected = event.value;
            this.selectedCategory = selected;
            this.onChange(selected);
        }

        this.onTouched();
    }
}
