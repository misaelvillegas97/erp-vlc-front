import { Component, inject, resource, signal, WritableSignal } from '@angular/core';
import { TranslocoDirective, TranslocoService }                from '@ngneat/transloco';
import { PageHeaderComponent }                                 from '@layout/components/page-header/page-header.component';
import { ApexOptions, ChartComponent }                         from 'ng-apexcharts';
import { InvoicesService }                                     from '@modules/admin/administration/invoices/invoices.service';
import { firstValueFrom }                                      from 'rxjs';
import { isNull }                                              from 'lodash';
import { isUndefined }                                         from 'lodash-es';

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
    readonly #translationService = inject(TranslocoService);
    readonly #invoicesService = inject(InvoicesService);
    chartInvoicesByStatus: WritableSignal<ApexOptions> = signal<ApexOptions>(undefined);
    chartTotalInvoicedByDate: WritableSignal<ApexOptions> = signal<ApexOptions>(undefined);
    chartInvoicesByClient: WritableSignal<ApexOptions> = signal<ApexOptions>(undefined);
    chartOverduePercentage: WritableSignal<ApexOptions> = signal<ApexOptions>(undefined);
    chartAgingResults: WritableSignal<ApexOptions> = signal<ApexOptions>(undefined);
    chartAveragePaymentTime: WritableSignal<ApexOptions> = signal<ApexOptions>(undefined);
    chartPaidInvoicesByDate: WritableSignal<ApexOptions> = signal<ApexOptions>(undefined);
    chartInvoicesByDeliveryAssignment: WritableSignal<ApexOptions> = signal<ApexOptions>(undefined);
    chartOutstandingAmountByDate: WritableSignal<ApexOptions> = signal<ApexOptions>(undefined);

    dashboardResource = resource({
        loader: () => firstValueFrom(this.#invoicesService.getInvoicesOverview())
            .then((response) => {

                if (response['invoicesByStatus']) this.setChartInvoicesByStatus(response['invoicesByStatus']);
                if (response['totalInvoicedByDate']) this.setChartTotalInvoicedByDate(response['totalInvoicedByDate']);
                if (response['invoicesByClient']) this.setChartInvoicesByClient(response['invoicesByClient']);
                if (!isNull(response['overduePercentage']) || !isUndefined(response['overduePercentage'])) this.setChartOverduePercentage(response['overduePercentage']);
                if (response['agingResults'] && response['agingResults'].length > 0) this.setChartAgingResults(response['agingResults']);
                if (response['averagePaymentTime']) this.setChartAveragePaymentTime(response['averagePaymentTime']);
                if (response['paidInvoicesByDate']) this.setChartPaidInvoicesByDate(response['paidInvoicesByDate']);
                if (response['invoicesByDeliveryAssignment']) this.setChartInvoicesByDeliveryAssignment(response['invoicesByDeliveryAssignment']);
                if (response['outstandingAmountByDate']) this.setChartOutstandingAmountByDate(response['outstandingAmountByDate']);
            })
    });

    setChartTotalInvoicedByDate(totalInvoicedByDate: { date: string, total: number }[]) {
        const labels = totalInvoicedByDate.map((item) => item.date);
        const series = [ {
            name: 'Total',
            data: totalInvoicedByDate
                .map((item) => item.total)
        } ];

        this.chartTotalInvoicedByDate.set({
            chart      : {
                fontFamily: 'inherit',
                foreColor : 'var(--fuse-text-default)',
                height    : '100%',
                width     : '100%',
                type      : 'line',
                zoom      : {enabled: false}
            },
            colors     : [ '#818CF8' ],
            grid   : {
                borderColor    : 'var(--fuse-border)',
                strokeDashArray: 4,
                yaxis          : {
                    lines: {
                        show: true,
                    }
                }
            },
            markers: {
                size        : 4,
                colors      : [ '#818CF8' ],
                strokeColors: 'var(--fuse-background)',
                strokeWidth : 2,
                hover       : {
                    size      : 7,
                    sizeOffset: 3
                }
            },
            noData : {text: 'No hay datos'},
            plotOptions: {
                radar: {
                    polygons: {
                        strokeColors   : 'var(--fuse-border)',
                        connectorColors: 'var(--fuse-border)',
                    },
                },
            },
            series     : series,
            stroke     : {
                width: 2,
                curve: 'smooth'
            },
            tooltip    : {
                theme: 'dark'
            },
            xaxis      : {
                type      : 'datetime',
                categories: labels,
            },
            yaxis      : {
                title : {text: 'Total invoiced'},
                labels: {
                    formatter(val: number): string | string[] {
                        return Intl.NumberFormat('es-CL', {style: 'currency', currency: 'CLP'}).format(val);
                    }
                }
            },
        });
    }

    setChartInvoicesByStatus(invoicesByStatus: { status: string, total: number }[]) {
        const statusLabels = invoicesByStatus.map(item => item.status);
        const statusSeries = invoicesByStatus.map(item => Number(item.total));

        this.chartInvoicesByStatus.set({
            chart: {
                type      : 'donut',
                height    : '100%',
                width     : '100%',
                fontFamily: 'inherit',
                foreColor : 'var(--fuse-text-default)'
            },
            // ISSUED bg-yellow-500, RECEIVED_WITHOUT_OBSERVATIONS bg-blue-500, RECEIVED_WITH_OBSERVATIONS bg-green-500, PAID bg-indigo-500, REJECTED bg-red-500
            colors : [ '#FBBF24', '#60A5FA', '#34D399', '#6366F1', '#F87171' ],
            labels : statusLabels.map(status => this.#translationService.translate('enums.invoice-status.' + status)),
            legend : {
                position: 'bottom'
            }, // Puedes ajustar los colores según tus estados
            series : statusSeries,
            tooltip: {
                theme: 'dark'
            }
        });
    }

    setChartInvoicesByClient(invoicesByClient: { clientId: string, clientFantasyName: string, totalAmount: string }[]) {
        const clientLabels = invoicesByClient.map(item => item.clientFantasyName);
        const clientSeries = [ {
            name: 'Monto total',
            data: invoicesByClient.map(item => Number(item.totalAmount))
        } ];

        this.chartInvoicesByClient.set({
            chart     : {
                type      : 'bar',
                height    : '100%',
                width     : '100%',
                fontFamily: 'inherit',
                foreColor : 'var(--fuse-text-default)'
            },
            colors    : [ '#4ADE80' ],
            dataLabels: {
                enabled  : true,
                formatter: (val: number) => Intl.NumberFormat('es-CL', {style: 'currency', currency: 'CLP'}).format(val)
            },
            grid  : {
                borderColor    : 'var(--fuse-border)',
                strokeDashArray: 4,
                yaxis          : {
                    lines: {
                        show: true
                    }
                }
            },
            labels: clientLabels,
            noData: {text: 'No hay datos'},
            series    : clientSeries,
            tooltip   : {theme: 'dark'},
            yaxis     : {
                labels: {
                    formatter: (val: number) => Intl.NumberFormat('es-CL', {style: 'currency', currency: 'CLP'}).format(val)
                }
            }
        });
    }

    setChartOverduePercentage(overduePercentage: number) {
        this.chartOverduePercentage.set({
            chart      : {
                type      : 'radialBar',
                height    : '100%',
                width     : '100%',
                fontFamily: 'inherit',
                foreColor : 'var(--fuse-text-default)',
            },
            colors     : [ '#F472B6' ],
            labels     : [ 'Vencidas' ],
            plotOptions: {
                radialBar: {
                    dataLabels: {
                        name : {
                            fontSize: '22px',
                        },
                        value: {
                            fontSize : '16px',
                            formatter: (val: number) => `${ val.toFixed(1) }%`
                        }
                    }
                }
            },
            series     : [ overduePercentage ],
            tooltip    : {theme: 'dark'}
        });
    }

    setChartAgingResults(agingResults: { bucket: string, total: number }[]) {
        const agingLabels = agingResults.map(item => item.bucket);
        const agingSeries = agingResults.map(item => Number(item.total));

        this.chartAgingResults.set({
            chart  : {
                fontFamily: 'inherit',
                foreColor : 'var(--fuse-text-default)',
                height    : '100%',
                type      : 'donut',
                width     : '100%'
            },
            colors : [ '#6366F1', '#FBBF24', '#34D399', '#F87171' ],
            labels : agingLabels,
            legend : {position: 'bottom'},
            series : agingSeries,
            tooltip: {theme: 'dark'}
        });
    }

    setChartAveragePaymentTime(averagePaymentTime: number) {
        this.chartAveragePaymentTime.set({
            chart      : {
                type      : 'radialBar',
                height    : '100%',
                width     : '100%',
                fontFamily: 'inherit',
                foreColor : 'var(--fuse-text-default)',
            },
            colors     : [ '#60A5FA' ],
            labels     : [ 'Promedio' ],
            noData     : {text: 'No hay datos'},
            plotOptions: {
                radialBar: {
                    dataLabels: {
                        name : {
                            fontSize: '22px',
                        },
                        value: {
                            fontSize : '16px',
                            formatter: (val: number) => `${ val.toFixed(1) } días`
                        }
                    }
                }
            },
            series     : [ averagePaymentTime ],
            tooltip    : {theme: 'dark'}
        });
    }

    setChartPaidInvoicesByDate(paidInvoicesByDate: { date: string, paidCount: number, totalCount: number }[]) {
        const paidDates = paidInvoicesByDate.map(item => item.date);
        const paidSeries = paidInvoicesByDate.map(item => Number(item.paidCount));
        const pendingSeries = paidInvoicesByDate.map(item => Number(item.totalCount) - Number(item.paidCount));

        this.chartPaidInvoicesByDate.set({
            chart      : {
                type      : 'bar',
                height    : '100%',
                width     : '100%',
                stacked   : true,
                fontFamily: 'inherit',
                foreColor : 'var(--fuse-text-default)'
            },
            colors     : [ '#10B981', '#F59E0B' ],
            noData: {text: 'No hay datos'},
            grid  : {
                borderColor    : 'var(--fuse-border)',
                strokeDashArray: 4,
                yaxis          : {
                    lines: {
                        show: true
                    }
                }
            },
            plotOptions: {
                bar: {horizontal: false}
            },
            series     : [
                {name: 'Pagadas', data: paidSeries},
                {name: 'Pendientes', data: pendingSeries}
            ],
            tooltip    : {theme: 'dark'},
            xaxis      : {
                type      : 'datetime',
                categories: paidDates
            }
        });
    }

    setChartInvoicesByDeliveryAssignment(invoicesByDeliveryAssignment: { deliveryAssignmentId: string, deliveryAssignmentName: string, total: string }[]) {
        const deliveryLabels = invoicesByDeliveryAssignment.map(item => item.deliveryAssignmentId || 'Sin asignar');
        const deliverySeries = invoicesByDeliveryAssignment.map(item => Number(item.total));

        this.chartInvoicesByDeliveryAssignment.set({
            chart  : {
                type      : 'pie',
                height    : '100%',
                width     : '100%',
                fontFamily: 'inherit',
                foreColor : 'var(--fuse-text-default)'
            },
            colors : [ '#34D399', '#60A5FA', '#FBBF24', '#F472B6' ],
            labels : deliveryLabels,
            legend : {position: 'bottom'},
            series : deliverySeries,
            tooltip: {theme: 'dark'}
        });
    }

    setChartOutstandingAmountByDate(outstandingAmountByDate: { date: string, outstandingTotal: number }[]) {
        const outstandingLabels = outstandingAmountByDate.map(item => item.date);
        const outstandingSeries = [ {
            name: 'Monto pendiente',
            data: outstandingAmountByDate.map(item => Number(item.outstandingTotal))
        } ];

        this.chartOutstandingAmountByDate.set({
            chart  : {
                type      : 'line',
                height: '100%',
                width : '100%',
                zoom      : {enabled: false},
                fontFamily: 'inherit',
                foreColor : 'var(--fuse-text-default)'
            },
            colors : [ '#F87171' ],
            dataLabels: {
                enabled  : true,
                formatter: (val: number) => Intl.NumberFormat('es-CL', {style: 'currency', currency: 'CLP'}).format(val)
            },
            grid: {
                borderColor    : 'var(--fuse-border)',
                strokeDashArray: 4,
                yaxis          : {
                    lines: {
                        show: true
                    }
                }
            },
            markers: {
                size        : 4,
                colors      : [ '#F87171' ],
                strokeColors: 'var(--fuse-background)',
                strokeWidth : 2,
                hover       : {
                    size      : 7,
                    sizeOffset: 3
                }
            },
            noData: {text: 'No hay datos'},
            series : outstandingSeries,
            stroke : {
                width: 2,
                curve: 'smooth'
            },
            tooltip: {theme: 'dark'},
            xaxis  : {
                type      : 'datetime',
                categories: outstandingLabels
            },
            yaxis  : {
                title : {text: 'Monto pendiente'},
                labels: {
                    formatter: (val: number) => Intl.NumberFormat('es-CL', {style: 'currency', currency: 'CLP'}).format(val)
                }
            }
        });
    }
}
