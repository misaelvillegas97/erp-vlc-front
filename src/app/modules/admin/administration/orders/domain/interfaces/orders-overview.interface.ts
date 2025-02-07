export interface OrdersOverview {
    ordersCountByDate: { date: string, total: string }[];
    ordersByStatus: { status: string, total: string }[];
    ordersWithoutInvoiceCount: number;
    overdueOrdersCount: number;
    averageDeliveryTime: number;
    ordersByClient: { clientId: string, clientFantasyName: string; totalOrders: string }[];
    ordersRevenueByDate: { date: string, revenue: string }[];
}
