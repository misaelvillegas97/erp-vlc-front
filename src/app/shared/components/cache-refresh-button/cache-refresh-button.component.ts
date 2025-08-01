import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatButtonModule }                                    from '@angular/material/button';
import { MatIconModule }                                      from '@angular/material/icon';
import { MatTooltipModule }                                   from '@angular/material/tooltip';
import { PwaUpdateService }                                   from '@core/pwa/pwa-update.service';
import { NotyfService }                                       from '@shared/services/notyf.service';

@Component({
    selector       : 'cache-refresh-button',
    template       : `
        <button
            mat-icon-button
            [disabled]="isLoading()"
            (click)="clearCacheAndRefresh()"
            matTooltip="Borrar caché y actualizar"
            class="relative"
        >
            @if (isLoading()) {
                <mat-icon class="animate-spin">refresh</mat-icon>
            } @else {
                <mat-icon>cached</mat-icon>
            }
        </button>
    `,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports        : [
        MatButtonModule,
        MatIconModule,
        MatTooltipModule
    ]
})
export class CacheRefreshButtonComponent {
    private readonly pwaUpdateService = inject(PwaUpdateService);
    private readonly notyfService = inject(NotyfService);

    protected readonly isLoading = signal(false);

    async clearCacheAndRefresh(): Promise<void> {
        if (this.isLoading()) return;

        this.isLoading.set(true);

        try {
            // Step 1: Show initial notification
            this.notyfService.info('Iniciando limpieza de caché...');

            // Step 2: Clear cache if available
            if ('caches' in window) {
                await this.clearAllCaches();
                this.notyfService.success('Caché limpiado correctamente');
            }

            // Step 3: Check for updates
            this.notyfService.info('Buscando actualizaciones...');
            const updateAvailable = await this.pwaUpdateService.checkForUpdates();

            if (updateAvailable) {
                this.notyfService.success('Nueva versión encontrada. Actualizando...');
                // The PWA service will handle the update and reload
            } else {
                this.notyfService.info('No hay actualizaciones disponibles. Recargando página...');
                // Force reload even if no updates
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            }

        } catch (error) {
            console.error('Error during cache refresh:', error);
            this.notyfService.error('Error al limpiar caché o buscar actualizaciones');
            this.isLoading.set(false);
        }
    }

    private async clearAllCaches(): Promise<void> {
        try {
            const cacheNames = await caches.keys();
            const deletePromises = cacheNames.map(cacheName => caches.delete(cacheName));
            await Promise.all(deletePromises);
            console.log('All caches cleared successfully');
        } catch (error) {
            console.error('Error clearing caches:', error);
            throw error;
        }
    }
}
