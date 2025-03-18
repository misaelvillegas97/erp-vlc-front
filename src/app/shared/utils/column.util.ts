import { WritableSignal } from '@angular/core';
import { ColumnConfig }   from '@shared/components/table-builder/column.type';

export function toggleColumn(columnKey: string, columnsConfig: WritableSignal<ColumnConfig[]>, persistColumnsConfiguration: () => void): void {
    const currentConfig = columnsConfig();
    const index = currentConfig.findIndex((col) => col.key === columnKey);

    if (index !== -1) {
        const updatedColumn = {
            ...currentConfig[index],
            visible: !currentConfig[index].visible
        };

        const newConfig = [ ...currentConfig ];
        newConfig[index] = updatedColumn;

        columnsConfig.set(newConfig);
    }

    persistColumnsConfiguration();
}
