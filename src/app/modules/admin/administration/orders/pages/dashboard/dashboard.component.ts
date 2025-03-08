import { Component, inject, resource, signal, WritableSignal } from '@angular/core';
import { TranslocoDirective, TranslocoService }                from '@ngneat/transloco';
import { OrdersService }                                       from '@modules/admin/administration/orders/orders.service';
import { ApexOptions, ChartComponent }                         from 'ng-apexcharts';
import { PageHeaderComponent }                                 from '@layout/components/page-header/page-header.component';
import { firstValueFrom }                                      from 'rxjs';
import { OrdersOverview }                                      from '@modules/admin/administration/orders/domain/interfaces/orders-overview.interface';

@Component({
    selector   : 'app-dashboard',
    imports    : [
        PageHeaderComponent,
        ChartComponent,
        TranslocoDirective
    ],
    templateUrl: './dashboard.component.html'
})
export class DashboardComponent {
    readonly #translationService = inject(TranslocoService);
    readonly #ordersService = inject(OrdersService);

    chartOrdersCountByDate: WritableSignal<ApexOptions> = signal<ApexOptions>(undefined);
    chartOrdersByStatus: WritableSignal<ApexOptions> = signal<ApexOptions>(undefined);
    chartOrdersWithoutInvoiceCount: WritableSignal<ApexOptions> = signal<ApexOptions>(undefined);
    chartOverdueOrdersCount: WritableSignal<ApexOptions> = signal<ApexOptions>(undefined);
    chartAverageDeliveryTime: WritableSignal<ApexOptions> = signal<ApexOptions>(undefined);
    chartOrdersByClient: WritableSignal<ApexOptions> = signal<ApexOptions>(undefined);
    chartOrdersRevenueByDate: WritableSignal<ApexOptions> = signal<ApexOptions>(undefined);

    dashboardResource = resource({
        loader: () => firstValueFrom(this.#ordersService.getOrdersOverview())
            .then((overview: OrdersOverview) => {
                const {ordersCountByDate, ordersByStatus, ordersWithoutInvoiceCount, overdueOrdersCount, averageDeliveryTime, ordersByClient, ordersRevenueByDate} = overview;

                this.setChartOrdersCountByDate(ordersCountByDate.map(item => ({date: item.date, total: +item.total})));
                this.setChartOrdersByStatus(ordersByStatus.map(item => ({status: item.status, total: +item.total})));
                this.setChartOrdersWithoutInvoiceCount(ordersWithoutInvoiceCount);
                this.setChartOverdueOrdersCount(overdueOrdersCount);
                this.setChartAverageDeliveryTime(averageDeliveryTime);
                this.setChartOrdersByClient(ordersByClient.map(item => ({clientId: item.clientId, clientFantasyName: item.clientFantasyName, totalOrders: +item.totalOrders})));
                this.setChartOrdersRevenueByDate(ordersRevenueByDate.map(item => ({date: item.date, revenue: +item.revenue})));
            })
    });

    setChartOrdersCountByDate(ordersCountByDate: { date: string, total: number }[]) {
        const labels = ordersCountByDate.map(item => item.date);
        const series = [ {
            name: 'Ordenes',
            data: ordersCountByDate.map(item => Number(item.total))
        } ];

        this.chartOrdersCountByDate.set({
            chart  : {
                fontFamily: 'inherit',
                foreColor : 'var(--fuse-text-default)',
                height    : '100%',
                width     : '100%',
                type      : 'line',
                zoom      : {enabled: false}
            },
            colors : [ '#34D399' ], // Ejemplo: verde
            grid   : {
                borderColor    : 'var(--fuse-border)',
                strokeDashArray: 4,
                yaxis          : {lines: {show: true}}
            },
            markers: {
                size        : 4,
                colors      : [ '#34D399' ],
                strokeColors: 'var(--fuse-background)',
                strokeWidth : 2,
                hover       : {size: 7, sizeOffset: 3}
            },
            noData : {text: 'No hay datos'},
            series : series,
            stroke : {
                width: 2,
                curve: 'smooth'
            },
            tooltip: {theme: 'dark'},
            xaxis  : {
                type      : 'datetime',
                categories: labels
            },
            yaxis  : {
                title: {text: 'Cantidad de ordenes'},
                labels: {
                    formatter(val: number): string {
                        return val.toString();
                    }
                }
            }
        });
    }

    setChartOrdersByStatus(ordersByStatus: { status: string, total: number }[]) {
        const labels = ordersByStatus.map(item => item.status);
        const series = ordersByStatus.map(item => Number(item.total));

        this.chartOrdersByStatus.set({
            chart: {
                type      : 'donut',
                height    : '100%',
                width     : '100%',
                fontFamily: 'inherit',
                foreColor : 'var(--fuse-text-default)'
            },
            /**
             * 6 status:
             * "PENDING": "Pendiente",
             * "IN_PROGRESS": "En progreso",
             * "INVOICED": "Facturado",
             * "SHIPPED": "Enviado",
             * "DELIVERED": "Entregado",
             * "CANCELED": "Cancelado"
             */
            colors : [ '#F87171', '#FBBF24', '#60A5FA', '#34D399', '#4ADE80', '#F59E0B' ],
            labels : labels.map(label => this.#translationService.translate(`enums.order-status.${ label }`)),
            legend : {position: 'bottom'}, // Ajusta según la cantidad de estados
            noData : {text: 'No hay datos'},
            series : series,
            tooltip: {theme: 'dark'}
        });
    }

    setChartOrdersWithoutInvoiceCount(count: number) {
        this.chartOrdersWithoutInvoiceCount.set({
            chart      : {
                type      : 'radialBar',
                height    : '100%',
                width     : '100%',
                fontFamily: 'inherit',
                foreColor : 'var(--fuse-text-default)'
            },
            colors     : [ '#FBBF24' ],
            labels     : [ 'Sin Factura' ],
            noData     : {text: 'No hay datos'},
            plotOptions: {
                radialBar: {
                    dataLabels: {
                        name : {fontSize: '22px'},
                        value: {fontSize: '16px', formatter: (val: number) => `${ val }`}
                    }
                }
            },
            series     : [ count ],
            tooltip    : {theme: 'dark'}
        });
    }

    setChartOverdueOrdersCount(count: number) {
        this.chartOverdueOrdersCount.set({
            chart      : {
                type      : 'radialBar',
                height    : '100%',
                width     : '100%',
                fontFamily: 'inherit',
                foreColor : 'var(--fuse-text-default)'
            },
            colors     : [ '#F87171' ],
            labels: [ 'Ordenes Vencidas' ],
            noData     : {text: 'No hay datos'},
            plotOptions: {
                radialBar: {
                    dataLabels: {
                        name : {fontSize: '22px'},
                        value: {fontSize: '16px', formatter: (val: number) => `${ val }`}
                    }
                }
            },
            series     : [ count ],
            tooltip    : {theme: 'dark'}
        });
    }

    setChartAverageDeliveryTime(avgTime: number) {
        this.chartAverageDeliveryTime.set({
            chart      : {
                type      : 'radialBar',
                height    : '100%',
                width     : '100%',
                fontFamily: 'inherit',
                foreColor : 'var(--fuse-text-default)'
            },
            colors     : [ '#60A5FA' ],
            labels     : [ 'Promedio\nEntrega' ],
            noData     : {text: 'No hay datos'},
            plotOptions: {
                radialBar: {
                    dataLabels: {
                        name : {fontSize: '22px'},
                        value: {fontSize: '16px', formatter: (val: number) => `${ val.toFixed(1) } días`}
                    }
                }
            },
            series     : [ avgTime ],
            tooltip    : {theme: 'dark'}
        });
    }

    setChartOrdersByClient(ordersByClient: { clientId: string, clientFantasyName: string, totalOrders: number }[]) {
        const labels = ordersByClient.map(item => item.clientFantasyName);
        const series = [ {
            name: 'Ordenes',
            data: ordersByClient.map(item => Number(item.totalOrders))
        } ];

        this.chartOrdersByClient.set({
            chart      : {
                type      : 'bar',
                height    : '100%',
                width     : '100%',
                fontFamily: 'inherit',
                foreColor : 'var(--fuse-text-default)'
            },
            colors     : [ '#4ADE80' ],
            dataLabels : {enabled: true},
            grid       : {
                borderColor    : 'var(--fuse-border)',
                strokeDashArray: 4,
                yaxis          : {
                    lines: {
                        show: true
                    }
                }
            },
            noData     : {text: 'No hay datos'},
            plotOptions: {
                bar: {horizontal: false}
            },
            series     : series,
            tooltip    : {theme: 'dark'},
            xaxis      : {categories: labels},
        });
    }

    setChartOrdersRevenueByDate(ordersRevenueByDate: { date: string, revenue: number }[]) {
        const labels = ordersRevenueByDate.map(item => item.date);
        const series = [ {
            name: 'Recaudación',
            data: ordersRevenueByDate.map(item => Number(item.revenue))
        } ];

        this.chartOrdersRevenueByDate.set({
            chart  : {
                type      : 'line',
                height    : '100%',
                width     : '100%',
                fontFamily: 'inherit',
                foreColor : 'var(--fuse-text-default)',
                zoom      : {enabled: false}
            },
            colors : [ '#FBBF24' ],
            grid   : {
                borderColor    : 'var(--fuse-border)',
                strokeDashArray: 4,
                yaxis          : {lines: {show: true}}
            },
            markers: {
                size        : 4,
                colors      : [ '#FBBF24' ],
                strokeColors: 'var(--fuse-background)',
                strokeWidth : 2,
                hover       : {size: 7, sizeOffset: 3}
            },
            noData : {text: 'No hay datos'},
            series : series,
            stroke : {
                width: 2,
                curve: 'smooth'
            },
            tooltip: {theme: 'dark'},
            xaxis  : {
                type      : 'datetime',
                categories: labels
            },
            yaxis  : {
                title : {text: 'Recaudación'},
                labels: {
                    formatter: (val: number) => Intl.NumberFormat('es-CL', {style: 'currency', currency: 'CLP'}).format(val)
                }
            }
        });
    }

}
