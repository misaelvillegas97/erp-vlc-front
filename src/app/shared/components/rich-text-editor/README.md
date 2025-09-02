# Rich Text Editor Component

A reusable rich text editor component built with ngx-editor for Angular applications. This component is fully compatible with reactive forms and implements the `ControlValueAccessor` interface.

## Features

- **Reactive Forms Compatible**: Implements `ControlValueAccessor` for seamless integration with Angular reactive forms
- **Material Design**: Integrates with Angular Material form fields and styling
- **Rich Text Editing**: Full WYSIWYG editor with toolbar options
- **Customizable**: Configurable labels, placeholders, and validation
- **Accessibility**: Built-in accessibility features
- **Responsive**: Mobile-friendly design

## Installation

Make sure ngx-editor is installed in your project:

```bash
npm install ngx-editor
```

## Usage

### Basic Usage

```typescript
import {Component} from '@angular/core';
import {FormBuilder, FormGroup} from '@angular/forms';
import {RichTextEditorComponent} from '@shared/components/rich-text-editor/rich-text-editor.component';

@Component({
    selector: 'app-example',
    standalone: true,
    imports: [RichTextEditorComponent, ReactiveFormsModule],
    template: `
    <form [formGroup]="form">
      <rich-text-editor formControlName="content"></rich-text-editor>
    </form>
  `
})
export class ExampleComponent {
    form: FormGroup;

    constructor(private fb: FormBuilder) {
        this.form = this.fb.group({
            content: ['']
        });
    }
}
```

### Advanced Usage with Custom Configuration

```typescript
import {Component} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {RichTextEditorComponent} from '@shared/components/rich-text-editor/rich-text-editor.component';

@Component({
    selector: 'app-example',
    standalone: true,
    imports: [RichTextEditorComponent, ReactiveFormsModule],
    template: `
    <form [formGroup]="form">
      <rich-text-editor 
        formControlName="description"
        label="Descripción del producto"
        placeholder="Ingrese la descripción detallada..."
        [required]="true"
        controlClasses="custom-editor-class">
      </rich-text-editor>
    </form>
  `
})
export class ExampleComponent {
    form: FormGroup;

    constructor(private fb: FormBuilder) {
        this.form = this.fb.group({
            description: ['', Validators.required]
        });
    }
}
```

## Input Properties

| Property          | Type              | Default             | Description                                    |
|-------------------|-------------------|---------------------|------------------------------------------------|
| `label`           | `string`          | `'Editor de texto'` | The label displayed above the editor           |
| `placeholder`     | `string`          | `'Escriba aquí...'` | Placeholder text shown in the editor           |
| `floatLabel`      | `FloatLabelType`  | `'always'`          | Material form field float label behavior       |
| `subscriptSizing` | `SubscriptSizing` | `'fixed'`           | Material form field subscript sizing           |
| `controlClasses`  | `string`          | `''`                | Additional CSS classes for the form field      |
| `required`        | `boolean`         | `false`             | Whether the field is required                  |
| `minHeight`       | `number`          | `120`               | Minimum height of the editor content area (px) |
| `maxHeight`       | `number`          | `300`               | Maximum height of the editor content area (px) |

## Toolbar Features

The editor includes a comprehensive toolbar with the following features:

- **Text Formatting**: Bold, italic, underline, strikethrough
- **Paragraphs**: Blockquote, code blocks
- **Lists**: Ordered and bullet lists
- **Headings**: H1 through H6
- **Links and Media**: Link insertion, image upload
- **Colors**: Text color and background color
- **Alignment**: Left, center, right, justify alignment
- **Utilities**: Horizontal rule, format clear, undo/redo

## Validation

The component supports Angular form validation:

```typescript
// Required validation
this.form = this.fb.group({
  content: ['', Validators.required]
});

// Custom validation
this.form = this.fb.group({
  content: ['', [Validators.required, Validators.minLength(10)]]
});
```

## Styling

The component includes comprehensive CSS styling that integrates with Material Design. The editor adapts to your application's theme automatically.

### Custom Styling

You can override the default styles by targeting the component classes:

```scss
.custom-editor-class {
  .ngx-editor-wrapper {
    border-radius: 8px;
  }
  
  .NgxEditor__Content {
    min-height: 200px;
  }
}
```

## Accessibility

The component is built with accessibility in mind:

- Proper ARIA labels and roles
- Keyboard navigation support
- Screen reader compatibility
- Focus management

## Browser Compatibility

The component works in all modern browsers supported by Angular and ngx-editor:

- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 79+

## Error Handling

The component includes built-in error handling and displays validation messages when the field is required and empty.

## Performance

The component is optimized for performance:

- OnPush change detection strategy
- Proper cleanup in ngOnDestroy
- Efficient event handling with RxJS operators

## Examples

### Simple Contact Form

```typescript
export class ContactFormComponent {
    contactForm = this.fb.group({
        name: ['', Validators.required],
        email: ['', [Validators.required, Validators.email]],
        message: ['', Validators.required]
    });

    constructor(private fb: FormBuilder) {
    }
}
```

```html

<form [formGroup]="contactForm">
    <mat-form-field>
        <mat-label>Nombre</mat-label>
        <input matInput formControlName="name">
    </mat-form-field>

    <mat-form-field>
        <mat-label>Email</mat-label>
        <input matInput type="email" formControlName="email">
    </mat-form-field>

    <rich-text-editor
        formControlName="message"
        label="Mensaje"
        [required]="true">
    </rich-text-editor>

    <button mat-raised-button color="primary" [disabled]="contactForm.invalid">
        Enviar
    </button>
</form>
```

## API Reference

### Methods

The component implements the `ControlValueAccessor` interface with the following methods:

- `writeValue(value: string): void` - Sets the value programmatically
- `registerOnChange(fn: Function): void` - Registers change callback
- `registerOnTouched(fn: Function): void` - Registers touched callback
- `setDisabledState(isDisabled: boolean): void` - Enables/disables the editor

### Events

The component handles the following events internally:

- Content changes (triggers form value updates)
- Focus/blur events (for validation display)
- Editor initialization and cleanup

## Troubleshooting

### Common Issues

1. **Editor not displaying**: Ensure ngx-editor is properly installed and imported
2. **Styles not applied**: Check that Material theme is properly configured
3. **Form validation not working**: Verify that validators are set on the FormControl

### Dependencies

This component requires:

- Angular 15+
- Angular Material
- ngx-editor
- RxJS

## Contributing

When making changes to this component:

1. Follow the project's TypeScript and Angular style guides
2. Update this README if adding new features
3. Test with reactive forms in different scenarios
4. Ensure accessibility standards are maintained
