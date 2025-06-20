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
