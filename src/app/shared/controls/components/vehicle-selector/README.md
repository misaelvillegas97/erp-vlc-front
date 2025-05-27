# Vehicle Selector Component

A reusable component for selecting vehicles from a dropdown list. This component can be used with both reactive forms and template-driven forms.

## Features

- Works with Reactive Forms (formControl, formControlName)
- Works with Template-driven Forms (ngModel)
- Customizable label, placeholder, and other options
- Automatically loads vehicles from the VehiclesService
- Includes an option to select "All" vehicles

## Usage

### With Reactive Forms

```html
<!-- Using formControl directly -->
<app-vehicle-selector [formControl]="vehicleControl"></app-vehicle-selector>

<!-- Using formControlName within a FormGroup -->
<form [formGroup]="myForm">
    <app-vehicle-selector formControlName="vehicle"></app-vehicle-selector>
</form>
```

### With Template-driven Forms

```html
<!-- Using ngModel -->
<app-vehicle-selector [(ngModel)]="selectedVehicleId"></app-vehicle-selector>
```

## Customization

The component accepts several inputs for customization:

```html

<app-vehicle-selector
    [formControl]="vehicleControl"
    label="Select Vehicle"
    placeholder="Choose a vehicle"
    [includeAllOption]="false"
    allOptionLabel="All Vehicles"
    [required]="true"
></app-vehicle-selector>
```

## Inputs

| Input            | Type    | Default                | Description                         |
|------------------|---------|------------------------|-------------------------------------|
| label            | string  | 'Vehículo'             | The label for the form field        |
| placeholder      | string  | 'Seleccionar vehículo' | The placeholder text for the select |
| includeAllOption | boolean | true                   | Whether to include an "All" option  |
| allOptionLabel   | string  | 'Todos'                | The label for the "All" option      |
| required         | boolean | false                  | Whether the field is required       |
