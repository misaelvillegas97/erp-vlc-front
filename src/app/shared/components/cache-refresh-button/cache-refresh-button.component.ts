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
            (click)="reinstall()"
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

    async reinstall(): Promise<void> {
        try {
            // 1) Desregistrar todos los SW
            if ('serviceWorker' in navigator) {
                console.log('Unregistering all service workers...');
                const regs = await navigator.serviceWorker.getRegistrations();
                await Promise.all(regs.map(r => r.unregister().catch(() => {})));
            }

            // 2) Borrar todas las caches (incluidas ngsw:*)
            if ('caches' in window) {
                console.log('Clearing all caches...');
                const keys = await caches.keys();
                await Promise.all(keys.map(k => caches.delete(k)));
            }

            // 3) Eliminar IndexedDB usado por Angular SW
            await Promise.all([
                this.deleteDb('ngsw:db'),
                this.deleteDb('ngsw:control') // puede no existir; no pasa nada
            ]);

            // 4) Recarga sin SW para forzar fetch de archivos “limpios”
            const url = new URL(location.href);
            url.searchParams.set('ngsw-bypass', 'true');
            location.replace(url.toString());
        } catch (e) {
            console.error('PWA reinstall failed', e);
            // opcional: mostrar toast al usuario
        }
    }

    private deleteDb(name: string): Promise<void> {
        return new Promise(resolve => {
            const req = indexedDB.deleteDatabase(name);
            req.onsuccess = req.onerror = req.onblocked = () => resolve();
        });
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
