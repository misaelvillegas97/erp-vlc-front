export interface ActiveSessionsDashboardData {
    activeSessions: Count;
    averageDuration: AverageMinutes;
    totalDistance: TotalKm;
    vehiclesInUsePercentage: {
        percentage: number,
        activeCount: number,
        totalCount: number,
    };
    sessionDurationChart: {
        sessions: Array<{
            sessionId: string;
            driverName: string;
            vehicleLicensePlate: string;
            durationMinutes: number;
        }>;
    };
    averageSpeedChart: {
        sessions: Array<{
            sessionId: string;
            driverName: string;
            vehicleLicensePlate: string;
            averageSpeed: number; // km/h
        }>;
    };
}

export interface HistoricalAnalysisDashboardData {
    totalSessions: Count;
    totalDistance: TotalKm;
    totalTimeInRoute: TotalMinutes;
    averageDistancePerSession: AverageKm;
    sessionsPerDayChart: { data: DateCount[] };
    averageDurationByDayOfWeekChart: { data: DayWeekDuration[] };
    sessionStatusDistributionChart: { data: StatusCount[] };
    sessionDurationHistogramChart: { data: RangeMinutesCount[] };
}

export interface DriverPerformanceDashboardData {
    totalActiveDrivers: Count;
    mostActiveDriver: DriverSessionCount;
    averageSessionsPerDriver: { average: number };
    averageDistancePerDriver: AverageKm;
    topDriversBySessionsChart: TopDriversBySessionsChart;
    topDriversByDistanceChart: TopDriversByDistanceChart;
    sessionsByLicenseTypeChart: SessionsByLicenseTypeChart;
    driverActivityTrendChart: DriverActivityTrendChart;
}

export interface VehicleUtilizationDashboardData {
    totalActiveVehicles: Count;
    mostUsedVehicle: VehicleSessionCount;
    averageSessionsPerVehicle: Average;
    averageDistancePerVehicle: AverageKm;
    topVehiclesByUsageChart: TopVehiclesByUsageChart;
    topVehiclesByDistanceChart: TopVehiclesByDistanceChart;
    usageByVehicleTypeChart: UsageByVehicleTypeChart;
    costPerKmByVehicleChart: CostPerKmByVehicleChart;
    vehicleOdometerChart: VehicleOdometerChart;
}

export interface GeographicalAnalysisDashboardData {
    totalGpsPoints: Count;
    maxSpeed: MaxSpeed;
    averageDistance: AverageKm;
    mostVisitedAreas: MostVisitedAreas;
    speedDistributionChart: SpeedDistributionChart;
    sessionStartTimeDistributionChart: SessionStartTimeDistributionChart;
    sessionEndTimeDistributionChart: SessionEndTimeDistributionChart;
    heatMapData: HeatMapData;
    frequentRoutesData: FrequentRoutesData;
}

export interface Count {
    count: number;
}

export interface TotalKm {
    totalKm: number;
}

export interface TotalMinutes {
    totalMinutes: number;
}

export interface Average {
    average: number;
}

export interface AverageKm {
    averageKm: number;
}

export interface AverageMinutes {
    averageMinutes: number;
}

export interface DateCount {
    date: string;
    count: number;
}

export interface DayWeekDuration {
    dayOfWeek: string;
    dayNumber: number;
    averageDurationMinutes: number;
}

export interface StatusCount {
    status: string;
    statusLabel: string;
    count: number;
}

export interface RangeMinutesCount {
    range: string;
    minMinutes: number;
    maxMinutes?: number;
    count: number;
}

export interface TopDriversBySessionsChart {
    drivers: DriverSessionCount[];
}

export interface DriverSessionCount {
    driverId: string;
    firstName: string;
    lastName: string;
    sessionCount: number;
}

export interface TopDriversByDistanceChart {
    drivers: DriverDistance[];
}

export interface DriverDistance {
    driverId: string;
    firstName: string;
    lastName: string;
    totalDistance: number;
}

export interface SessionsByLicenseTypeChart {
    data: LicenseSessionsCount[];
}

export interface LicenseSessionsCount {
    licenseType: string;
    licenseLabel: string;
    sessionCount: number;
}

export interface DriverActivityTrendChart {
    weeks: string[];
    drivers: DriverSessionsWeekCount[];
}

export interface DriverSessionsWeekCount {
    driverId: string;
    firstName: string;
    lastName: string;
    sessionsByWeek: number[];
}

export interface TopVehiclesByUsageChart {
    vehicles: VehicleSessionCount[];
}

export interface VehicleSessionCount {
    vehicleId: string;
    displayName: string;
    licensePlate: string;
    sessionCount: number;
}

export interface TopVehiclesByDistanceChart {
    vehicles: VehicleTotalDistance[];
}

export interface VehicleTotalDistance {
    vehicleId: string;
    displayName: string;
    licensePlate: string;
    totalDistance: number;
}

export interface UsageByVehicleTypeChart {
    data: VehicleTypeSessionCount[];
}

export interface VehicleTypeSessionCount {
    vehicleType: string;
    typeLabel: string;
    sessionCount: number;
}

export interface CostPerKmByVehicleChart {
    vehicles: VehicleCostPerKm[];
}

export interface VehicleCostPerKm {
    vehicleId: string;
    displayName: string;
    licensePlate: string;
    costPerKm: number;
}

export interface VehicleOdometerChart {
    vehicles: VehicleOdometer[];
}

export interface VehicleOdometer {
    vehicleId: string;
    displayName: string;
    licensePlate: string;
    odometerReading: number;
}

export interface MaxSpeed {
    maxSpeedKmh: number;
    sessionId: string;
    driverId: string;
    vehicleId: string;
    timestamp: string;
}

export interface MostVisitedAreas {
    areas: AreaCount[];
}

export interface AreaCount {
    latitude: number;
    longitude: number;
    count: number;
}

export interface SpeedDistributionChart {
    data: SpeedCount[];
}

export interface SpeedCount {
    range: string;
    minSpeed: number;
    maxSpeed?: number;
    count: number;
}

export interface SessionStartTimeDistributionChart {
    data: SessionHourStartCount[];
}

export interface SessionHourStartCount {
    hour: number;
    label: string;
    count: number;
}

export interface SessionEndTimeDistributionChart {
    data: SessionHourEndCount[];
}

export interface SessionHourEndCount {
    hour: number;
    label: string;
    count: number;
}

export interface HeatMapData {
    points: Point[];
}

export interface Point {
    latitude: number;
    longitude: number;
    weight: number;
}

export interface FrequentRoutesData {
    routes: Route[];
}

export interface Route {
    id: string;
    count: number;
    path: Path[];
}

export interface Path {
    latitude: number;
    longitude: number;
}
