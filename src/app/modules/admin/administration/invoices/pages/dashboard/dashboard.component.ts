import { Component, inject, resource, signal } from '@angular/core';
import { TranslocoDirective }                  from '@ngneat/transloco';
import { PageHeaderComponent }                 from '@layout/components/page-header/page-header.component';
import { ApexOptions, ChartComponent }         from 'ng-apexcharts';
import { InvoicesService }                     from '@modules/admin/administration/invoices/invoices.service';
import { firstValueFrom }                      from 'rxjs';

@Component({
    selector   : 'app-dashboard',
    imports    : [
        TranslocoDirective,
        PageHeaderComponent,
        ChartComponent
    ],
    templateUrl: './dashboard.component.html'
})
export class DashboardComponent {
    readonly #invoicesService = inject(InvoicesService);
    chartTotalInvoicedByDate = signal<ApexOptions>(undefined);

    dashboardResource = resource({
        loader: () => firstValueFrom(this.#invoicesService.getInvoicesOverview())
            .then((response) => {
                if (response['totalInvoicedByDate']) {
                    const totalInvoicedByDate: { date: string, total: number }[] = response['totalInvoicedByDate'];
                    const labels = totalInvoicedByDate.map((item) => item.date);
                    // series { name = date, data = total }
                    const series = [ {
                        name: 'Total',
                        data: totalInvoicedByDate
                            .map((item) => item.total)
                    } ];

                    this.chartTotalInvoicedByDate.set({
                        chart     : {
                            height: 350,
                            type  : 'line',
                            zoom  : {
                                enabled: false
                            }
                        },
                        colors    : [ '#818CF8' ],
                        dataLabels: {
                            enabled   : true,
                            formatter : (val: number): string | number => Intl.NumberFormat('es-CL', {style: 'currency', currency: 'CLP'}).format(val),
                            textAnchor: 'start',
                            style     : {
                                fontSize  : '11px',
                                fontWeight: 500,
                            },
                            background: {
                                borderWidth: 0,
                                padding    : 2,
                            },
                            offsetY   : -5,
                        },
                        series    : series,
                        stroke    : {
                            width: 2,
                        },
                        tooltip   : {
                            theme: 'dark'
                        },
                        xaxis     : {
                            type      : 'datetime',
                            categories: labels,
                        },
                        yaxis     : {
                            title : {text: 'Total invoiced'},
                            labels: {
                                formatter(val: number, opts?: any): string | string[] {
                                    return Intl.NumberFormat('es-CL', {style: 'currency', currency: 'CLP'}).format(val);
                                }
                            }
                        },
                    });

                }
            })
    });
}
