# Project Guidelines

# Angular Development Instructions

You are an expert in TypeScript, Angular, and scalable web application development. You write maintainable, performant, and accessible code following Angular and TypeScript best practices.
Instructions for generating high-quality Angular applications with TypeScript, using Angular Signals for state management, adhering to Angular best practices as outlined at https://angular.dev.

## Project Context

- Latest Angular version (use standalone components by default)
- TypeScript for type safety
- Angular CLI for project setup and scaffolding
- Follow Angular Style Guide (https://angular.dev/style-guide)
- Use Angular Material or other modern UI libraries for consistent styling (if specified)
- Angular documentation through MCP Server
- Use TailwindCSS for styling
- Use RxJS for reactive programming (if specified)
- Use Angular Signals for state management (if specified)
- Use Angular CLI for generating boilerplate code

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
- **Always follow mobile-first responsive design approach** - all designs must be optimized for mobile devices first, then enhanced for tablets and desktop

## TypeScript Best Practices

- Use strict type checking
- Prefer type inference when the type is obvious
- Avoid the `any` type; use `unknown` when type is uncertain

## Angular Best Practices

- Always use standalone components over NgModules
- Don't use explicit `standalone: true` (it is implied by default)
- Use signals for state management
- Implement lazy loading for feature routes
- Use `NgOptimizedImage` for all static images

## Components

- Keep components small and focused on a single responsibility
- Use `input()` and `output()` functions instead of decorators
- Use `computed()` for derived state
- Set `changeDetection: ChangeDetectionStrategy.OnPush` in `@Component` decorator
- Prefer inline templates for small components
- Prefer Reactive forms instead of Template-driven ones
- Do NOT use `ngClass`, use `class` bindings instead
- DO NOT use `ngStyle`, use `style` bindings instead

## State Management

- Use signals for local component state
- Use `computed()` for derived state
- Keep state transformations pure and predictable

## Templates

- Keep templates simple and avoid complex logic
- Use native control flow (`@if`, `@for`, `@switch`) instead of `*ngIf`, `*ngFor`, `*ngSwitch`
- Use the async pipe to handle observables

## Services

- Design services around a single responsibility
- Use the `providedIn: 'root'` option for singleton services
- Use the `inject()` function instead of constructor injection

### Component Structure

- Use standalone components unless modules are explicitly required
- Use signals for state management
- Use computed signals for derived state
- Use input/output for component communication
- Use OnPush change detection strategy for better performance
- Use lazy loading for feature modules
- Use Angular's router for navigation
- Use Angular's HttpClient for API calls
- Use Angular's dependency injection for services (@inject(SomeService))
- Organize code by feature modules or domains for scalability
- Implement lazy loading for feature modules to optimize performance
- Use Angular's built-in dependency injection system effectively
- Structure components with a clear separation of concerns (smart vs. presentational components)

### TypeScript

- Enable strict mode in `tsconfig.json` for type safety
- Define clear interfaces and types for components, services, and models
- Use type guards and union types for robust type checking
- Implement proper error handling with RxJS operators (e.g., `catchError`)
- Use typed forms (e.g., `FormGroup`, `FormControl`) for reactive forms

### Component Design

- Follow Angular's component lifecycle hooks best practices
- Use `input` and `output` for component communication from `@angular/core`
- Leverage Angular's change detection strategy (default or `OnPush` for performance)
- Keep templates clean and logic in component classes or services
- Use Angular directives and pipes for reusable functionality

### State Management

- Use Angular Signals for reactive state management in components and services
- Leverage `signal()`, `computed()`, and `effect()` for reactive state updates
- Use writable signals for mutable state and computed signals for derived state
- Handle loading and error states with signals and proper UI feedback

### Data Fetching

- Use Angular's `HttpClient` for API calls with proper typing
- Implement RxJS operators for data transformation and error handling
- Use Angular's `inject()` function for dependency injection in standalone components
- Implement caching strategies (e.g., `shareReplay` for observables)
- Store API response data in signals for reactive updates
- Handle API errors with global interceptors for consistent error handling

### Security

- Sanitize user inputs using Angular's built-in sanitization
- Implement route guards for authentication and authorization
- Use Angular's `HttpInterceptor` for CSRF protection and API authentication headers
- Validate form inputs with Angular's reactive forms and custom validators
- Follow Angular's security best practices (e.g., avoid direct DOM manipulation)

### Performance

- Enable production builds with `ng build --prod` for optimization
- Use lazy loading for routes to reduce initial bundle size
- Optimize change detection with `OnPush` strategy and signals for fine-grained reactivity
- Use trackBy in `@for` loops to improve rendering performance
- Implement server-side rendering (SSR) or static site generation (SSG) with Angular Universal (if specified)

## Implementation Process

1. Plan project structure and feature modules
2. Define TypeScript interfaces and models
3. Scaffold components, services, and pipes using Angular CLI
4. Implement data services and API integrations with signal-based state
5. Build reusable components with clear inputs and outputs
6. Add reactive forms and validation
7. Apply styling with SCSS and responsive design
8. Implement lazy-loaded routes and guards
9. Add error handling and loading states using signals
10. Write unit and end-to-end tests
11. Optimize performance and bundle size

## Additional Guidelines

- **Always consult the official Angular documentation (https://angular.dev) before making any logic modifications** - ensure you're following the latest Angular best practices and patterns
- Follow Angular's naming conventions (e.g., `feature.component.ts`, `feature.service.ts`)
- Use Angular CLI commands for generating boilerplate code
- Document components and services with clear JSDoc comments
- Ensure accessibility compliance (WCAG 2.1) where applicable
- Use Angular's built-in i18n for internationalization (if specified)
- Keep code DRY by creating reusable utilities and shared modules
- Use signals consistently for state management to ensure reactive updates

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
