# Table Builder Component

The Table Builder component is a flexible and powerful table component that supports various column types and renderers. It's designed to be easy to use and customize.

## Features

- Support for various column types: text, date, currency, number, badge, icon, button, actions, progress, toggle, checkbox, link, image, and custom
- Conditional rendering based on row data
- Custom formatting and styling
- Filtering and sorting
- Pagination
- Tooltips
- Responsive design

## Column Types

### Text Column

Displays text content with optional formatting.

```typescript
{
    key: 'name',
        header
:
    'Name',
        display
:
    {
        type: 'text',
            formatter
    :
        (value) => value.toUpperCase(),
            tooltip
    :
        'User name'
    }
,
    visible: true
}
```

### Date Column

Displays date values with formatting.

```typescript
{
    key: 'createdAt',
        header
:
    'Created At',
        display
:
    {
        type: 'date',
            pipeOptions
    :
        {
            format: 'dd/MM/yyyy'
        }
    ,
        tooltip: 'Creation date'
    }
,
    visible: true
}
```

### Currency Column

Displays currency values with formatting.

```typescript
{
    key: 'price',
        header
:
    'Price',
        display
:
    {
        type: 'currency',
            pipeOptions
    :
        {
            currency: 'USD',
                symbolDisplay
        :
            'symbol'
        }
    ,
        tooltip: 'Product price'
    }
,
    visible: true
}
```

### Number Column

Displays numeric values with formatting.

```typescript
{
    key: 'quantity',
        header
:
    'Quantity',
        display
:
    {
        type: 'number',
            pipeOptions
    :
        {
            digitsInfo: '1.0-2'
        }
    ,
        tooltip: 'Product quantity'
    }
,
    visible: true
}
```

### Badge Column

Displays a badge with a label and color.

```typescript
{
    key: 'status',
        header
:
    'Status',
        display
:
    {
        type: 'badge',
            formatter
    :
        (value) => value.toUpperCase(),
            pipeOptions
    :
        {
            color: (value) => value === 'active' ? 'green' : 'red'
        }
    }
,
    visible: true
}
```

### Icon Column

Displays an icon with optional tooltip and click handler.

```typescript
{
    key: 'status',
        header
:
    'Status',
        display
:
    {
        type: 'icon',
            icon
    :
        (value) => value === 'active' ? 'check_circle' : 'cancel',
            iconColor
    :
        (value) => value === 'active' ? 'text-green-500' : 'text-red-500',
            iconSize
    :
        '24px',
            tooltip
    :
        (value) => value === 'active' ? 'Active' : 'Inactive',
            onClick
    :
        (row) => console.log('Icon clicked', row)
    }
,
    visible: true
}
```

### Button Column

Displays a button with optional icon, label, and click handler.

```typescript
{
    key: 'actions',
        header
:
    'Actions',
        display
:
    {
        type: 'button',
            buttonLabel
    :
        'Edit',
            buttonIcon
    :
        'edit',
            buttonColor
    :
        'primary',
            buttonType
    :
        'raised',
            tooltip
    :
        'Edit user',
            onClick
    :
        (row) => console.log('Button clicked', row)
    }
,
    visible: true
}
```

### Actions Column

Displays one or more action buttons with icons and labels.

```typescript
{
    key: 'actions',
        header
:
    'Actions',
        display
:
    {
        type: 'actions',
            actions
    :
        [
            {icon: 'edit', action: 'edit', label: 'Edit', tooltip: 'Edit user'},
            {icon: 'delete', action: 'delete', label: 'Delete', tooltip: 'Delete user', color: 'warn'}
        ],
            action
    :
        (action, row) => console.log('Action clicked', action, row)
    }
,
    visible: true
}
```

### Progress Column

Displays a progress bar with optional value display.

```typescript
{
    key: 'progress',
        header
:
    'Progress',
        display
:
    {
        type: 'progress',
            progressColor
    :
        (value) => value < 50 ? 'warn' : 'primary',
            progressMode
    :
        'determinate',
            tooltip
    :
        (value) => `${value}% complete`
    }
,
    visible: true
}
```

### Toggle Column

Displays a toggle switch with optional change handler.

```typescript
{
    key: 'active',
        header
:
    'Active',
        display
:
    {
        type: 'toggle',
            toggleChange
    :
        (checked, row) => console.log('Toggle changed', checked, row),
            toggleDisabled
    :
        (row) => row.locked,
            tooltip
    :
        'Toggle user active status'
    }
,
    visible: true
}
```

### Checkbox Column

Displays a checkbox with optional change handler.

```typescript
{
    key: 'selected',
        header
:
    'Select',
        display
:
    {
        type: 'checkbox',
            checkboxChange
    :
        (checked, row) => console.log('Checkbox changed', checked, row),
            checkboxDisabled
    :
        (row) => row.locked,
            tooltip
    :
        'Select user'
    }
,
    visible: true
}
```

### Link Column

Displays a link with optional URL and target.

```typescript
{
    key: 'website',
        header
:
    'Website',
        display
:
    {
        type: 'link',
            linkUrl
    :
        (value) => value,
            linkTarget
    :
        '_blank',
            tooltip
    :
        'Visit website'
    }
,
    visible: true
}
```

### Image Column

Displays an image with optional fallback and tooltip.

```typescript
{
    key: 'avatar',
        header
:
    'Avatar',
        display
:
    {
        type: 'image',
            imageAlt
    :
        (value, row) => `${row.name}'s avatar`,
            imageFallback
    :
        'assets/images/default-avatar.png',
            imageWidth
    :
        '40px',
            imageHeight
    :
        '40px',
            tooltip
    :
        'User avatar'
    }
,
    visible: true
}
```

### Custom Column

Displays custom content using a template.

```typescript
{
    key: 'custom',
        header
:
    'Custom',
        display
:
    {
        type: 'custom',
            customTemplate
    :
        myCustomTemplate
    }
,
    visible: true
}
```

## Filtering

The table supports various filter types:

- Text filter
- Date filter
- Date range filter
- Number filter
- Number range filter
- Select filter
- Autocomplete filter

Example:

```typescript
{
    key: 'name',
        header
:
    'Name',
        display
:
    {
        type: 'text'
    }
,
    filter: {
        type: 'text',
            control
    :
        new FormControl('')
    }
,
    visible: true
}
```

## Pagination

The table supports pagination with customizable page size and navigation.

```typescript
<table-builder
    [ columns ] = "columns"
    [ data ] = "data"
    [ pagination ] = "{
limit: 10,
    totalPages
:
5,
    page
:
1,
    totalElements
:
50,
    disabled
:
false
}
"
(paginationChange) = "onPageChange($event)"
    > </table-builder>
```

## Styling

The table supports custom styling through CSS classes and inline styles.

```typescript
{
    key: 'name',
        header
:
    'Name',
        display
:
    {
        type: 'text',
            classes
    :
        'font-bold text-blue-500',
            containerClasses
    :
        'p-2',
            alignment
    :
        'center',
            width
    :
        '200px'
    }
,
    visible: true
}
```

## Conditional Rendering

Most properties support conditional rendering based on row data.

```typescript
{
    key: 'status',
        header
:
    'Status',
        display
:
    {
        type: 'badge',
            formatter
    :
        (value) => value.toUpperCase(),
            classes
    :
        (row) => row.status === 'active' ? 'font-bold' : '',
            pipeOptions
    :
        {
            color: (value) => value === 'active' ? 'green' : 'red'
        }
    }
,
    visible: true
}
```
