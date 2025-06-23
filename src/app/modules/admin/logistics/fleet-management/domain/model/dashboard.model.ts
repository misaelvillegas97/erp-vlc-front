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
    sessionsByLicenseTypeChart: Data<LicenseSessionsCount>;
    driverActivityTrendChart: DriverActivityTrendChart;
}

export interface VehicleUtilizationDashboardData {
    totalActiveVehicles: Count;
    mostUsedVehicle: VehicleSessionCount;
    averageSessionsPerVehicle: Average;
    averageDistancePerVehicle: AverageKm;
    topVehiclesByUsageChart: TopVehiclesByUsageChart;
    topVehiclesByDistanceChart: TopVehiclesByDistanceChart;
    usageByVehicleTypeChart: Data<VehicleTypeSessionCount>;
    costPerKmByVehicleChart: CostPerKmByVehicleChart;
    vehicleOdometerChart: VehicleOdometerChart;
}

export interface GeographicalAnalysisDashboardData {
    totalGpsPoints: Count;
    maxSpeed: MaxSpeed;
    averageDistance: AverageKm;
    mostVisitedAreas: MostVisitedAreas;
    speedDistributionChart: Data<SpeedCount>;
    sessionStartTimeDistributionChart: Data<SessionHourStartCount>;
    sessionEndTimeDistributionChart: Data<SessionHourEndCount>;
    heatMapData: HeatMapData;
    frequentRoutesData: FrequentRoutesData;
}

export interface ComplianceSafetyDashboardData {
    expiredSessions: CountPercentage;
    speedViolations: CountSpeedViolations;
    expiringLicenses: Count;
    expiredSessionsTrendChart: Data<MonthPercentage>;
    incidentsByVehicleTypeChart: Data<IncidentsByVehicleType>;
    incidentsByDriverChart: DriverData<IncidentsCountByDriver>;
    expiringLicensesTable: { licenses: ExpiringDriverLicense[] };
    maintenanceAlertsTable: { alerts: MaintenanceAlertChart[] };
    speedViolationsTable: { violations: SpeedViolations[] };
}

interface Data<T> {
    data: T[];
}

interface DriverData<T> {
    drivers: T[];
}

interface Count {
    count: number;
}

interface CountPercentage {
    count: number;
    percentage: number;
}

interface CountSpeedViolations {
    count: number;
    speedLimit: number;
}

interface TotalKm {
    totalKm: number;
}

interface TotalMinutes {
    totalMinutes: number;
}

interface Average {
    average: number;
}

interface AverageKm {
    averageKm: number;
}

interface AverageMinutes {
    averageMinutes: number;
}

interface DateCount {
    date: string;
    count: number;
}

interface DayWeekDuration {
    dayOfWeek: string;
    dayNumber: number;
    averageDurationMinutes: number;
}

interface StatusCount {
    status: string;
    statusLabel: string;
    count: number;
}

interface RangeMinutesCount {
    range: string;
    minMinutes: number;
    maxMinutes?: number;
    count: number;
}

interface TopDriversBySessionsChart {
    drivers: DriverSessionCount[];
}

interface DriverSessionCount {
    driverId: string;
    firstName: string;
    lastName: string;
    sessionCount: number;
}

interface TopDriversByDistanceChart {
    drivers: DriverDistance[];
}

interface DriverDistance {
    driverId: string;
    firstName: string;
    lastName: string;
    totalDistance: number;
}

interface LicenseSessionsCount {
    licenseType: string;
    licenseLabel: string;
    sessionCount: number;
}

interface DriverActivityTrendChart {
    weeks: string[];
    drivers: DriverSessionsWeekCount[];
}

interface DriverSessionsWeekCount {
    driverId: string;
    firstName: string;
    lastName: string;
    sessionsByWeek: number[];
}

interface TopVehiclesByUsageChart {
    vehicles: VehicleSessionCount[];
}

interface VehicleSessionCount {
    vehicleId: string;
    displayName: string;
    licensePlate: string;
    sessionCount: number;
}

interface TopVehiclesByDistanceChart {
    vehicles: VehicleTotalDistance[];
}

interface VehicleTotalDistance {
    vehicleId: string;
    displayName: string;
    licensePlate: string;
    totalDistance: number;
}

interface VehicleTypeSessionCount {
    vehicleType: string;
    typeLabel: string;
    sessionCount: number;
}

interface CostPerKmByVehicleChart {
    vehicles: VehicleCostPerKm[];
}

interface VehicleCostPerKm {
    vehicleId: string;
    displayName: string;
    licensePlate: string;
    costPerKm: number;
}

interface VehicleOdometerChart {
    vehicles: VehicleOdometer[];
}

interface VehicleOdometer {
    vehicleId: string;
    displayName: string;
    licensePlate: string;
    odometerReading: number;
}

interface MaxSpeed {
    maxSpeedKmh: number;
    sessionId: string;
    driverId: string;
    vehicleId: string;
    timestamp: string;
}

interface MostVisitedAreas {
    areas: AreaCount[];
}

interface AreaCount {
    latitude: number;
    longitude: number;
    count: number;
}

interface SpeedCount {
    range: string;
    minSpeed: number;
    maxSpeed?: number;
    count: number;
}

interface SessionHourStartCount {
    hour: number;
    label: string;
    count: number;
}

interface SessionHourEndCount {
    hour: number;
    label: string;
    count: number;
}

interface HeatMapData {
    points: Point[];
}

interface Point {
    latitude: number;
    longitude: number;
    weight: number;
}

interface FrequentRoutesData {
    routes: Route[];
}

interface Route {
    id: string;
    count: number;
    path: Path[];
}

interface Path {
    latitude: number;
    longitude: number;
}

interface MonthPercentage {
    month: string;
    label: string;
    percentage: number;
}

interface IncidentsByVehicleType {
    vehicleType: string;
    typeLabel: string;
    incidentCount: number;
}

interface IncidentsCountByDriver {
    driverId: string;
    firstName: string;
    lastName: string;
    incidentCount: number;
}

interface ExpiringDriverLicense {
    driverId: string;
    firstName: string;
    lastName: string;
    licenseType: string;
    expiryDate: string;
    daysUntilExpiry: number;
}

export interface MaintenanceAlertChart {
    vehicleId: string;
    brand: string;
    model: string;
    licensePlate: string;
    alertType: 'date' | 'odometer';
    dueDate?: string;
    dueKm?: number;
    daysUntilDue?: number;
    kmUntilDue?: number;
}

interface SpeedViolations {
    sessionId: string;
    driverId: string;
    firstName: string;
    lastName: string;
    vehicleId: string;
    licensePlate: string;
    timestamp: string;
    speed: number;
    speedLimit: number;
    excess: number;
}
