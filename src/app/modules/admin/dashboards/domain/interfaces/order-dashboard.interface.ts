export interface IClientOrderStats {
    id: string; // ID del cliente
    businessName: string; // Nombre comercial del cliente
    fantasyName: string; // Nombre de fantasía del cliente
    completed: number; // Cantidad de órdenes completadas
    pending: number; // Cantidad de órdenes pendientes
    middle: number; // Cantidad de órdenes en estado intermedio
    canceled: number; // Cantidad de órdenes canceladas
    totalOrders: number; // Total de órdenes del cliente
}

export interface ICountOverview {
    completed: number; // Total de órdenes completadas
    middle: number; // Total de órdenes en estado intermedio
    pending: number; // Total de órdenes pendientes
    canceled: number; // Total de órdenes canceladas
}

export interface ICountsByType {
    [key: string]: number; // Clave: tipo de orden, Valor: cantidad
}

export interface ICountsByStatus {
    [key: string]: number; // Clave: estado de orden, Valor: cantidad
}

export interface IDashboardOverview {
    orders: any[]; // Array de órdenes (puedes definir una interfaz más específica si es necesario)
    countOverview: ICountOverview; // Resumen de conteo de órdenes
    countsByType: ICountsByType; // Conteo de órdenes por tipo
    countsByStatus: ICountsByStatus; // Conteo de órdenes por estado
    countsByClient: { [key: string]: IClientOrderStats }; // Conteo de órdenes por cliente
    nextDeliveries: INextDelivery[]; // Próximas entregas
}

export interface INextDelivery {
    orderNumber: string; // Número de orden
    deliveryDate: string; // Fecha de entrega
    deliveryLocation: string; // Ubicación de entrega
    type: string; // Tipo de orden
    client: string; // Nombre del cliente
}
