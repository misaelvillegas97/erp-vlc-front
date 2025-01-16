import { Component, forwardRef, OnDestroy, OnInit } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR }  from '@angular/forms';
import { MatFormFieldModule, MatLabel }             from '@angular/material/form-field';
import { MatOptionModule }                          from '@angular/material/core';
import { MatSelectModule }                          from '@angular/material/select';

import { BehaviorSubject } from 'rxjs';

import { NewsCategoryService } from './news-category.service';
import { Selector }            from '../../model/selector';
import { TranslocoPipe }       from '@ngneat/transloco';

@Component({
    selector   : 'news-categories-selector',
    templateUrl: './news-categories-selector.component.html',
    standalone : true,
    imports    : [
        MatFormFieldModule,
        MatSelectModule,
        MatOptionModule,
        MatLabel,
        TranslocoPipe
    ],
    providers  : [
        {
            provide    : NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => NewsCategoriesSelectorComponent),
            multi      : true
        }
    ]
})
export class NewsCategoriesSelectorComponent implements ControlValueAccessor, OnInit, OnDestroy {
    categories: Selector[];
    selectedCategory: any;

    private _unsubscribeAll: BehaviorSubject<any> = new BehaviorSubject<any>(null);

    constructor(private newsCategoryService: NewsCategoryService) { }

    ngOnInit() {
        this.newsCategoryService.selector$.subscribe(data => this.categories = data);
    }

    ngOnDestroy() {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
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
