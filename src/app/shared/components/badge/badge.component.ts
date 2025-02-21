import { Component, computed, input }          from '@angular/core';
import { NgClass }                             from '@angular/common';
import { BadgeColor, COLOR_MAP, ColorMapping } from '@shared/components/badge/domain/model/badge.type';

@Component({
    selector   : 'badge',
    imports    : [ NgClass ],
    templateUrl: './badge.component.html'
})
export class BadgeComponent {
    readonly label = input.required<string>();
    readonly color = input.required<BadgeColor>();

    // Creamos un signal computado que devuelve el mapeo de estilos basado en el valor actual de "color"
    colorMapping = computed<ColorMapping>(() => COLOR_MAP[this.color()]);
}
