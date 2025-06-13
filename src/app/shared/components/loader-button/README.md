# Loader Button Component

A versatile and customizable button component with loading state support for Angular applications.

## Features

- Multiple button variants (flat, raised, stroked/outlined, icon, fab, mini-fab)
- Loading state with animated spinner
- Icon support (start and end positions)
- Tooltip support
- Accessibility features
- Size variants (small, default, large)
- Support for both content projection and label property

## Usage

### Basic Usage

```html
<loader-button
  [loading]="isLoading"
  [disabled]="isDisabled"
  [label]="'Save'"
  (buttonClick)="onSave()">
</loader-button>
```

Or with content projection:

```html
<loader-button
  [loading]="isLoading"
  [disabled]="isDisabled"
  (buttonClick)="onSave()">
  Save
</loader-button>
```

### With Icons

```html
<loader-button
  [loading]="isLoading"
  [iconStart]="'heroicons_outline:save'"
  [label]="'Save'">
</loader-button>

<loader-button
  [loading]="isLoading"
  [iconEnd]="'heroicons_outline:arrow-right'"
  [label]="'Next'">
</loader-button>
```

### Different Variants

```html
<!-- Flat button (default) -->
<loader-button
  [variant]="'flat'"
  [label]="'Flat Button'">
</loader-button>

<!-- Raised button -->
<loader-button
  [variant]="'raised'"
  [label]="'Raised Button'">
</loader-button>

<!-- Stroked/Outlined button -->
<loader-button
  [variant]="'stroked'"
  [label]="'Stroked Button'">
</loader-button>

<!-- Icon button -->
<loader-button
  [variant]="'icon'"
  [iconStart]="'heroicons_outline:plus'"
  [tooltip]="'Add Item'">
</loader-button>

<!-- FAB button -->
<loader-button
  [variant]="'fab'"
  [iconStart]="'heroicons_outline:plus'"
  [tooltip]="'Add Item'">
</loader-button>

<!-- Mini FAB button -->
<loader-button
  [variant]="'mini-fab'"
  [iconStart]="'heroicons_outline:plus'"
  [tooltip]="'Add Item'">
</loader-button>
```

### Different Sizes

```html
<!-- Small button -->
<loader-button
  [size]="'small'"
  [label]="'Small Button'">
</loader-button>

<!-- Default size button -->
<loader-button
  [size]="'default'"
  [label]="'Default Button'">
</loader-button>

<!-- Large button -->
<loader-button
  [size]="'large'"
  [label]="'Large Button'">
</loader-button>
```

### With Tooltip

```html
<loader-button
  [label]="'Save'"
  [tooltip]="'Save changes to database'">
</loader-button>
```

### Form Submit Button

```html
<form (ngSubmit)="onSubmit()">
  <!-- Form fields -->
  <loader-button
    [buttonType]="'submit'"
    [loading]="isSubmitting"
    [disabled]="form.invalid"
    [label]="'Submit'">
  </loader-button>
</form>
```

## API Reference

### Inputs

| Input           | Type           | Default   | Description                                                           |
|-----------------|----------------|-----------|-----------------------------------------------------------------------|
| disabled        | boolean        | false     | Whether the button is disabled                                        |
| loading         | boolean        | false     | Whether to show the loading spinner                                   |
| label           | string         | 'button'  | Text to display on the button                                         |
| color           | string         | 'primary' | Button color (primary, accent, warn)                                  |
| spinnerDiameter | number         | 20        | Diameter of the loading spinner                                       |
| buttonType      | string         | 'button'  | HTML button type (button, submit, reset)                              |
| class           | string         | 'w-full'  | CSS classes to apply to the button                                    |
| variant         | ButtonVariant  | 'flat'    | Button variant (flat, raised, stroked, outlined, icon, fab, mini-fab) |
| size            | ButtonSize     | 'default' | Button size (small, default, large)                                   |
| iconStart       | string \| null | null      | Icon to display before the label                                      |
| iconEnd         | string \| null | null      | Icon to display after the label                                       |
| tooltip         | string \| null | null      | Tooltip text                                                          |
| ariaLabel       | string \| null | null      | Accessibility label                                                   |

### Outputs

| Output      | Type  | Description                        |
|-------------|-------|------------------------------------|
| buttonClick | Event | Emitted when the button is clicked |

## Types

```typescript
export type ButtonVariant = 'flat' | 'raised' | 'stroked' | 'outlined' | 'icon' | 'fab' | 'mini-fab';
export type ButtonSize = 'default' | 'small' | 'large';
```
