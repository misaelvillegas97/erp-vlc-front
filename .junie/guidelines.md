# Project Guidelines

## Project Overview

This is an Angular-based frontend application for an ERP suite of functionalities.

## Project Structure

- **src/app/modules**: Contains feature modules organized by functionality
    - **admin**: Admin-related features
        - **administration**: Contain main ERP functionalities
        - **dashboard**: Dashboard-related features
        - **logistics**: Logistics-related features, fleet management, and vehicle tracking
        - **maintainers**: Data maintenance features (vehicles, users, etc.)
    - **auth**: Authentication-related features
    - **dashboard**: Dashboard-related features
- **src/app/shared**: Contains shared components, services, and utilities
    - **components**: Reusable UI components
        - **table-builder**: A powerful table component with various cell renderers
        - **badge**: Badge component for status indicators
        - **file-upload**: Component for file uploads
        - **loader-button**: Button with loading state
        - **page-detail-header**: Header component for detail pages
    - **services**: Shared services
    - **utils**: Utility functions and helpers

## Table Builder Component

The Table Builder component is a flexible and powerful table component that supports various column types and renderers. It's designed to be easy to use and customize. See the [README.md](src/app/shared/components/table-builder/README.md) for detailed documentation.

## Development Guidelines

### Code Style

- Follow Angular style guide
- Use TypeScript features (strong typing, interfaces, etc.)
- Use Angular's reactive forms for form handling
- Use Angular Material components for UI
- Use TailwindCSS for styling

### Component Structure

- Use standalone components where possible
- Use signals for state management
- Use computed signals for derived state
- Use input/output for component communication
- Use OnPush change detection strategy for better performance
- Use lazy loading for feature modules
- Use Angular's router for navigation
- Use Angular's HttpClient for API calls
- Use Angular's dependency injection for services (@inject(SomeService))

### Testing

When implementing new features or fixing bugs, ensure that:

1. Unit tests are written for new functionality
2. Existing tests pass
3. The application builds without errors

To run tests:

```
ng test
```

### Building

To build the project:

```
ng build
```

For production build:

```
ng build --configuration=production
```

## Deployment

The application is deployed using a CI/CD pipeline. Any changes pushed to the main branch will trigger a build and deployment process.
