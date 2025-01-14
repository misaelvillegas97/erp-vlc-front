import { Component, DoCheck, EventEmitter, Input, OnChanges, Output, ViewChild } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule }                         from '@angular/forms';
import { MatFormField, MatOption, MatSelect, MatSelectTrigger }                  from '@angular/material/select';
import { MatCheckbox }                                                           from '@angular/material/checkbox';
import { NgClass, NgForOf, NgIf }                                                from '@angular/common';
import { MatIcon }                                                               from '@angular/material/icon';
import { MatIconButton }                                                         from '@angular/material/button';
import { MatFormFieldAppearance, MatLabel }                                      from '@angular/material/form-field';

@Component({
  selector   : 'mat-select-autocomplete',
  standalone : true,
  imports    : [
    MatFormField,
    MatLabel,
    MatSelect,
    MatSelectTrigger,
    ReactiveFormsModule,
    MatCheckbox,
    NgIf,
    FormsModule,
    NgClass,
    MatIcon,
    MatIconButton,
    MatOption,
    NgForOf
  ],
  templateUrl: './mat-select-autocomplete.component.html',
  styleUrl   : './mat-select-autocomplete.component.scss'
})
export class MatSelectAutocompleteComponent implements OnChanges, DoCheck {
  @Input() selectPlaceholder = 'search...';
  @Input() label = '';
  @Input() placeholder = '';
  @Input() options: any[] = [];
  @Input() disabled = false;
  @Input() display = 'display';
  @Input() value = 'value';
  @Input() formControl = new FormControl();
  @Input() errorMsg = 'Field is required';
  @Input() showErrorMsg = false;
  @Input() selectedOptions: any[] = [];
  @Input() multiple = true;
  @Input() labelCount = 1;
  @Input() appearance: MatFormFieldAppearance = 'fill';
  @Output() selectionChange = new EventEmitter<any[]>();
  @ViewChild('selectElem') selectElem: MatSelect;

  filteredOptions: any[] = [];
  selectedValue: any[] = [];
  selectAllChecked = false;
  displayString = '';

  ngOnChanges(): void {
    if (this.disabled) {
      this.formControl.disable();
    } else {
      this.formControl.enable();
    }
    this.filteredOptions = this.options;
    this.selectedValue = this.selectedOptions || this.formControl.value || [];
  }

  ngDoCheck(): void {
    if (!this.selectedValue.length) {
      this.selectionChange.emit(this.selectedValue);
    }
  }

  toggleDropdown(): void {
    this.selectElem.toggle();
  }

  toggleSelectAll(val): void {
    if (val.checked) {
      this.filteredOptions.forEach(option => {
        if (!this.selectedValue.includes(option[this.value])) {
          this.selectedValue = this.selectedValue.concat([ option[this.value] ]);
        }
      });
    } else {
      const filteredValues = this.getFilteredOptionsValues();
      this.selectedValue = this.selectedValue.filter(item => !filteredValues.includes(item));
    }
    this.selectionChange.emit(this.selectedValue);
  }

  filterItem(value): void {
    this.filteredOptions = this.options.filter(item => item[this.display].toLowerCase().indexOf(value.toLowerCase()) > -1);
    this.selectAllChecked = true;
    this.filteredOptions.forEach(item => {
      if (!this.selectedValue.includes(item[this.value])) {
        this.selectAllChecked = false;
      }
    });
    if (!this.filteredOptions.length) {
      this.selectAllChecked = false;
    }
  }

  hideOption(option): boolean {
    return !(this.filteredOptions.indexOf(option) > -1);
  }

  getFilteredOptionsValues(): string[] {
    return this.filteredOptions.map(option => option[this.value]);
  }

  onDisplayString(): string {
    this.displayString = '';
    if (this.selectedValue && this.selectedValue.length) {
      let displayOption = [];
      if (this.multiple) {
        for (let i = 0; i < this.labelCount; i++) {
          displayOption[i] = this.options.find(option => option[this.value] === this.selectedValue[i]);
        }
        this.displayString = displayOption
          .filter(option => option)
          .map(option => option[this.display])
          .join(', ');
        if (this.selectedValue.length > this.labelCount) {
          this.displayString += ` (+${ this.selectedValue.length - this.labelCount } others)`;
        }
      } else {
        displayOption = this.options.find(option => option[this.value] === this.selectedValue);
        this.displayString = displayOption ? displayOption[this.display] : '';
      }
    }
    return this.displayString;
  }

  onSelectionChange(val): void {
    const filteredValues = this.getFilteredOptionsValues();
    let count = 0;
    if (this.multiple) {
      this.selectedValue.forEach(item => {
        if (filteredValues.includes(item)) {
          count++;
        }
      });
      this.selectAllChecked = count === this.filteredOptions.length;
    }
    this.selectedValue = val.value;
    this.selectionChange.emit(this.selectedValue);
  }

  trackByFn(index, item): any {
    return item[this.value];
  }
}
