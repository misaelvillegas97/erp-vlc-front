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

export interface Count {
    count: number;
}

export interface TotalKm {
    totalKm: number;
}

export interface TotalMinutes {
    totalMinutes: number;
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
