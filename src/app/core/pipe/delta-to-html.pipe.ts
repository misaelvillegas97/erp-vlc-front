import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name      : 'deltaToHtml',
    standalone: true
})
export class DeltaToHtmlPipe implements PipeTransform {

    transform(delta: any): string {
        if (delta) delta = JSON.parse(delta);

        if (!delta || !delta.ops) {
            return '';
        }
        let html = '';
        let listType = ''; // Para manejar listas

        delta.ops.forEach((op: any) => {
            if (typeof op.insert === 'string') {
                let text = op.insert;

                // Manejar atributos de estilo
                if (op.attributes) {
                    if (op.attributes.bold) text = `<strong>${ text }</strong>`;
                    if (op.attributes.italic) text = `<em>${ text }</em>`;
                    if (op.attributes.underline) text = `<u>${ text }</u>`;
                    if (op.attributes.strike) text = `<s>${ text }</s>`;
                    if (op.attributes.link) text = `<a href="${ op.attributes.link }">${ text }</a>`;
                    if (op.attributes.header) text = `<h${ op.attributes.header }>${ text }</h${ op.attributes.header }>`;
                }

                // Manejar listas
                if (op.attributes && op.attributes.list) {
                    if (listType !== op.attributes.list) {
                        if (listType) {
                            html += listType === 'ordered' ? '</ol>' : '</ul>';
                        }
                        listType = op.attributes.list;
                        html += listType === 'ordered' ? '<ol>' : '<ul>';
                    }
                    html += `<li>${ text }</li>`;
                } else {
                    if (listType) {
                        html += listType === 'ordered' ? '</ol>' : '</ul>';
                        listType = '';
                    }
                    html += text;
                }
            } else if (op.insert.image) {
                html += `<img src="${ op.insert.image }" alt="Image" />`;
            } else if (op.insert.video) {
                html += `<iframe src="${ op.insert.video }" frameborder="0" allowfullscreen></iframe>`;
            } else if (op.insert.formula) {
                html += `<span class="formula">${ op.insert.formula }</span>`;
            }
        });

        // Cerrar lista si está abierta
        if (listType) {
            html += listType === 'ordered' ? '</ol>' : '</ul>';
        }

        return html;
    }
}
