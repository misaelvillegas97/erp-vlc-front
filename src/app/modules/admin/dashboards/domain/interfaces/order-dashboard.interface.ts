export interface IClientOrderStats {
    id: string;
    businessName: string;
    fantasyName: string;
    completed: number;
    pending: number;
    middle: number;
    canceled: number;
    totalOrders: number;
}

export interface ICountOverview {
    completed: number;
    middle: number;
    pending: number;
    canceled: number;
}

export interface ICountsByType {
    [key: string]: number;
}

export interface ICountsByStatus {
    [key: string]: number;
}

export interface IDashboardOverview {
    orders: any[];
    sumAmount: number;
    countOverview: ICountOverview;
    countsByType: ICountsByType;
    countsByStatus: ICountsByStatus;
    countsByClient: { [key: string]: IClientOrderStats };
    nextDeliveries: INextDelivery[];
}

export interface IProductMini {
    upcCode: string;
    name: string;
    unitaryPrice: number;
    quantity: number;
}

export interface INextDelivery {
    orderNumber: string;
    deliveryDate: string;
    deliveryLocation: string;
    type: string;
    client: string;
    products: IProductMini[];
}
