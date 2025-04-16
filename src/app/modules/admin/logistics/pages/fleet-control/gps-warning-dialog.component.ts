import { Component, inject }             from '@angular/core';
import { CommonModule }                  from '@angular/common';
import { MatButtonModule }               from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule }                 from '@angular/material/icon';

@Component({
    selector  : 'app-gps-warning-dialog',
    standalone: true,
    imports   : [
        CommonModule,
        MatButtonModule,
        MatDialogModule,
        MatIconModule
    ],
    template  : `
        <div class="p-6 sm:p-8">
            <div class="flex items-center justify-between mb-6">
                <h2 class="text-xl font-bold">Permiso de ubicación requerido</h2>
                <button mat-icon-button (click)="dialogRef.close()" aria-label="Cerrar">
                    <mat-icon svgIcon="heroicons_outline:x-mark"></mat-icon>
                </button>
            </div>

            <div>
                <div class="flex flex-col items-center justify-center mb-6">
                    <div class="bg-blue-50 dark:bg-blue-900 p-4 rounded-full mb-4 flex">
                        <mat-icon class="text-blue-500 dark:text-blue-200" svgIcon="heroicons_outline:map-pin" style="width: 32px; height: 32px;"></mat-icon>
                    </div>

                    <p class="text-center mb-4">
                        Esta aplicación requiere acceso a su ubicación para poder registrar correctamente el inicio y finalización de una sesión de vehículo.
                    </p>

                    <div class="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-lg p-3 mb-4 w-full">
                        <p class="flex items-start text-sm">
                            <mat-icon class="icon-size-5 text-amber-500 mr-2 flex-shrink-0 mt-0.5" svgIcon="heroicons_outline:exclamation-triangle"></mat-icon>
                            <span>Si su navegador solicita permisos de ubicación, por favor seleccione <strong>"Permitir"</strong> para continuar.</span>
                        </p>
                    </div>

                    <p class="text-center text-sm text-gray-500 dark:text-gray-400">
                        Si no concede permisos de ubicación, algunas funcionalidades del sistema no estarán disponibles.
                    </p>
                </div>

                <div class="flex justify-center">
                    <button mat-flat-button color="primary" (click)="dialogRef.close()">
                        Entendido
                    </button>
                </div>
            </div>
        </div>
    `
})
export class GpsWarningDialogComponent {
    readonly dialogRef = inject(MatDialogRef);
}
