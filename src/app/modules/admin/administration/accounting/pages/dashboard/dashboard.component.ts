import { Component, inject, resource }                from '@angular/core';
import { MatCardModule }                              from '@angular/material/card';
import { MatButtonModule }                            from '@angular/material/button';
import { MatIconModule }                              from '@angular/material/icon';
import { MatDividerModule }                           from '@angular/material/divider';
import { DecimalPipe, NgClass }                       from '@angular/common';
import { RouterLink }                                 from '@angular/router';
import { AccountingService }                          from '@modules/admin/administration/accounting/accounting.service';
import { firstValueFrom }                             from 'rxjs';
import { CustomerInvoice, CustomerInvoiceStatusEnum } from '@modules/admin/administration/accounting/domain/models/customer-invoice';
import { SupplierInvoice }                            from '@modules/admin/administration/accounting/domain/models/supplier-invoice';
import { BankTransaction }                            from '@modules/admin/administration/accounting/domain/models/transaction';
import { PageDetailHeaderComponent }                  from '@shared/components/page-detail-header/page-detail-header.component';
import { TranslocoDirective }                         from '@ngneat/transloco';
import Chart                                          from 'chart.js/auto';
import { DateTime }                                   from 'luxon';

@Component({
    selector  : 'app-dashboard',
    standalone: true,
    imports   : [
        MatCardModule,
        MatButtonModule,
        MatIconModule,
        MatDividerModule,
        DecimalPipe,
        NgClass,
        RouterLink,
        PageDetailHeaderComponent,
        TranslocoDirective
    ],
    templateUrl: './dashboard.component.html'
})
export class DashboardComponent {
    readonly #service = inject(AccountingService);

    // Gráficos
    cashFlowChart: Chart;
    payablesChart: Chart;
    receivablesChart: Chart;

    // Recursos de datos
    receivablesResource = resource({
        loader: () => firstValueFrom(this.#service.getReceivables())
    });

    payablesResource = resource({
        loader: () => firstValueFrom(this.#service.getPayables())
    });

    accountsResource = resource({
        loader: () => firstValueFrom(this.#service.getBankAccounts())
    });

    transactionsResource = resource({
        loader: () => firstValueFrom(this.#service.getBankTransactions())
    });

    summaryResource = resource({
        loader: () => firstValueFrom(this.#service.getFinancialSummary())
    });

    // Estadísticas calculadas
    get totalPayables(): number {
        return this.payablesResource.value()?.reduce((sum, invoice) => sum + invoice.grossAmount, 0) || 0;
    }

    get totalReceivables(): number {
        return this.receivablesResource.value()?.reduce((sum, invoice) => sum + invoice.grossAmount, 0) || 0;
    }

    get totalBankBalance(): number {
        return this.accountsResource.value()?.reduce((sum, account) => sum + account.balance, 0) || 0;
    }

    get cashFlow(): number {
        return this.totalReceivables - this.totalPayables;
    }

    // Alertas
    get overdueReceivables(): CustomerInvoice[] {
        const today = DateTime.now();
        return this.receivablesResource.value()?.filter(invoice =>
            invoice.status !== CustomerInvoiceStatusEnum.PAID &&
            DateTime.fromISO(invoice.dueDate) < today
        ) || [];
    }

    get upcomingPayables(): SupplierInvoice[] {
        const today = DateTime.now();
        const nextWeek = today.plus({days: 7});
        return this.payablesResource.value()?.filter(invoice =>
            invoice.dueDate &&
            DateTime.fromISO(invoice.dueDate) > today &&
            DateTime.fromISO(invoice.dueDate) < nextWeek
        ) || [];
    }

    get recentTransactions(): BankTransaction[] {
        return (this.transactionsResource.value() || []).sort((a, b) =>
            new Date(b.date).getTime() - new Date(a.date).getTime()
        ).slice(0, 5);
    }

    ngOnInit(): void {
        // Cargar todos los datos
        Promise.all([
            this.receivablesResource.reload(),
            this.payablesResource.reload(),
            this.accountsResource.reload(),
            this.transactionsResource.reload(),
            this.summaryResource.reload()
        ]).then(() => {
            this.renderCharts();
        });
    }

    ngAfterViewInit(): void {
        // Inicializar los gráficos cuando esté disponible el DOM
        setTimeout(() => this.renderCharts(), 100);
    }

    renderCharts(): void {
        // Solo renderizar si los elementos existen y los datos están disponibles
        if (document.getElementById('cashFlowChart') && this.summaryResource.value()) {
            this.renderCashFlowChart();
        }

        if (document.getElementById('payablesChart') && this.payablesResource.value()) {
            this.renderPayablesChart();
        }

        if (document.getElementById('receivablesChart') && this.receivablesResource.value()) {
            this.renderReceivablesChart();
        }
    }

    private renderCashFlowChart(): void {
        const ctx = document.getElementById('cashFlowChart') as HTMLCanvasElement;

        if (this.cashFlowChart) {
            this.cashFlowChart.destroy();
        }

        // Datos de ejemplo para el gráfico de flujo de efectivo
        const data = this.summaryResource.value()?.cashFlow || [ 1000, 1500, 1200, 1800, 900, 1400 ];
        const labels = [ 'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun' ];

        this.cashFlowChart = new Chart(ctx, {
            type   : 'line',
            data   : {
                labels  : labels,
                datasets: [ {
                    label      : 'Flujo de Efectivo',
                    data       : data,
                    borderColor: 'rgb(75, 192, 192)',
                    tension    : 0.1,
                    fill       : false
                } ]
            },
            options: {
                responsive         : true,
                maintainAspectRatio: false
            }
        });
    }

    private renderPayablesChart(): void {
        const ctx = document.getElementById('payablesChart') as HTMLCanvasElement;

        if (this.payablesChart) {
            this.payablesChart.destroy();
        }

        // Datos para el gráfico de cuentas por pagar por estado
        const payables = this.payablesResource.value() || [];
        const pending = payables.filter(p => p.status === 'PENDING').length;
        const paid = payables.filter(p => p.status === 'PAID').length;
        const overdue = payables.filter(p => p.status === 'OVERDUE').length;

        this.payablesChart = new Chart(ctx, {
            type   : 'doughnut',
            data   : {
                labels  : [ 'Pendiente', 'Pagado', 'Vencido' ],
                datasets: [ {
                    data           : [ pending, paid, overdue ],
                    backgroundColor: [
                        'rgb(255, 205, 86)',
                        'rgb(75, 192, 192)',
                        'rgb(255, 99, 132)'
                    ]
                } ]
            },
            options: {
                responsive         : true,
                maintainAspectRatio: false
            }
        });
    }

    private renderReceivablesChart(): void {
        const ctx = document.getElementById('receivablesChart') as HTMLCanvasElement;

        if (this.receivablesChart) {
            this.receivablesChart.destroy();
        }

        // Datos para el gráfico de cuentas por cobrar por estado
        const receivables = this.receivablesResource.value() || [];
        const issued = receivables.filter(r => r.status === 'ISSUED').length;
        const paid = receivables.filter(r => r.status === 'PAID').length;
        const overdue = receivables.filter(r => r.status === 'OVERDUE').length;

        this.receivablesChart = new Chart(ctx, {
            type   : 'doughnut',
            data   : {
                labels  : [ 'Emitida', 'Pagada', 'Vencida' ],
                datasets: [ {
                    data           : [ issued, paid, overdue ],
                    backgroundColor: [
                        'rgb(54, 162, 235)',
                        'rgb(75, 192, 192)',
                        'rgb(255, 99, 132)'
                    ]
                } ]
            },
            options: {
                responsive         : true,
                maintainAspectRatio: false
            }
        });
    }
}
