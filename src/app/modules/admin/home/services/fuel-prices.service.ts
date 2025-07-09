import { Injectable }                                                                   from '@angular/core';
import { HttpClient, HttpHeaders }                                                      from '@angular/common/http';
import { catchError, map, Observable, of, shareReplay, switchMap, throwError, timeout } from 'rxjs';
import { environment }                                                                  from '../../../../../environments/environment';

// Original interfaces for our app's data model
export interface FuelPrice {
    fuelType: string;
    price: number;
}

export interface GasStation {
    name: string;
    address: string;
    distance: number;
    prices: FuelPrice[];
    latitude?: number; // Optional for internal use
    longitude?: number; // Optional for internal use
    // Note: brand is used internally for grouping but not included in the interface
}

export interface FuelPricesData {
    stations: GasStation[];
    averagePrice: number;
    weeklyTrend: {
        percentage: number;
        increasing: boolean;
    };
    lastUpdated: Date;
}

// API response interfaces based on the provided model
export interface LoginResponse {
    token: string;
}

export interface Root {
    codigo: string;
    en_mantenimiento: number;
    horario_atencion: any;
    razon_social: string;
    distribuidor: Distribuidor;
    servicios: Servicios;
    metodos_de_pago: MetodosDePago;
    ubicacion: Ubicacion;
    punto_electrico: any[];
    precios: Precios;
}

export interface Distribuidor {
    marca: string;
    logo: string;
}

export interface Servicios {
    'Cajero automático': boolean;
    'Baño público': boolean;
    Farmacia: boolean;
    'Tienda de conveniencia': boolean;
    'Compresor de aire para neumáticos': boolean;
    'Lavado de autos': boolean;
    'Área de juegos para menores de edad': boolean;
    'Servicios mantención': boolean;
    'Surtidor para camiones': boolean;
    Duchas: boolean;
    Lubricentro: boolean;
    'AdBlue Granel': boolean;
}

export interface MetodosDePago {
    Efectivo: boolean;
    Cheque: boolean;
    'Tarjeta Grandes Tiendas': boolean;
    'Tarjetas Bancarias': boolean;
    'Tarjeta de Crédito': boolean;
    'Tarjeta de Débito': boolean;
    'App de pago': boolean;
    'Billetera Digital': boolean;
}

export interface Ubicacion {
    nombre_region: string;
    codigo_region: string;
    nombre_comuna: string;
    codigo_comuna: string;
    direccion: string;
    latitud: string;
    longitud: string;
}

export interface Precios {
    '93': N93;
    '97': N97;
    DI: Di;
    '95': N95;
}

export interface N93 {
    unidad_cobro: string;
    precio: string;
    fecha_actualizacion: string;
    hora_actualizacion: string;
    tipo_atencion: string;
}

export interface N97 {
    unidad_cobro: string;
    precio: string;
    fecha_actualizacion: string;
    hora_actualizacion: string;
    tipo_atencion: string;
}

export interface Di {
    unidad_cobro: string;
    precio: string;
    fecha_actualizacion: string;
    hora_actualizacion: string;
    tipo_atencion: string;
}

export interface N95 {
    unidad_cobro: string;
    precio: string;
    fecha_actualizacion: string;
    hora_actualizacion: string;
    tipo_atencion: string;
}

@Injectable({
    providedIn: 'root'
})
export class FuelPricesService {
    private loginUrl = 'https://api.cne.cl/api/login';
    private stationsUrl = 'https://api.cne.cl/api/v4/estaciones';
    private token: string | null = null;
    private email = environment.fuelApiEmail || '';
    private password = environment.fuelApiPassword || '';

    // User location and preferences
    private userLatitude: number = 19.4326;
    private userLongitude: number = -99.1332;
    private maxStations: number = 3;
    private maxDistance: number = 10;

    constructor(private http: HttpClient) {}

    /**
     * Get fuel prices from the nearest gas stations
     * @param latitude User's latitude
     * @param longitude User's longitude
     * @param maxStations Maximum number of stations to return
     * @param maxDistance Maximum distance in kilometers
     * @returns Observable with fuel prices data
     */
    getFuelPrices(
        latitude: number = 19.4326,
        longitude: number = -99.1332,
        maxStations: number = 5,
        maxDistance: number = 100
    ): Observable<FuelPricesData> {
        // Store the coordinates for distance calculation
        this.userLatitude = latitude;
        this.userLongitude = longitude;
        this.maxStations = maxStations;
        this.maxDistance = maxDistance;

        // First authenticate, then get stations
        return this.authenticate().pipe(
            map(token => {
                this.token = token;
                return token;
            }),
            switchMap(() => this.getStations()),
            catchError(error => {
                console.error('Error in fuel prices flow:', error);
                return this.getMockFuelPrices();
            })
        );
    }

    /**
     * Authenticate with the API to get a token
     * @returns Observable with the authentication token
     */
    private authenticate(): Observable<string> {
        const url = `${ this.loginUrl }?email=${ this.email }&password=${ this.password }`;

        return this.http.post<LoginResponse>(url, {}).pipe(
            map(response => response.token),
            catchError(error => {
                console.error('Authentication error:', error);
                return throwError(() => new Error('Failed to authenticate with fuel API'));
            })
        );
    }

    /**
     * Get gas stations data
     * @returns Observable with the stations data
     */
    private getStations(): Observable<FuelPricesData> {
        if (!this.token) {
            return throwError(() => new Error('No authentication token available'));
        }

        const headers = new HttpHeaders({
            'Authorization': `Bearer ${ this.token }`
        });

        return this.http.get<Root[]>(this.stationsUrl, {headers}).pipe(
            timeout(10000),
            shareReplay({
                bufferSize: 1,
                refCount  : false
            }),
            map(stations => this.transformStationsData(stations)),
            catchError(error => {
                let errorMessage = 'Error desconocido al cargar datos de estaciones';

                if (error.status === 0 || error.name === 'TimeoutError') {
                    errorMessage = 'Tiempo de espera agotado. Verifique su conexión a internet';
                } else if (error.status === 401) {
                    errorMessage = 'Token de autenticación inválido o expirado';
                } else if (error.status === 403) {
                    errorMessage = 'No tiene permisos para acceder a los datos de estaciones';
                } else if (error.status === 404) {
                    errorMessage = 'Servicio de estaciones no encontrado';
                } else if (error.status === 429) {
                    errorMessage = 'Demasiadas solicitudes. Intente nuevamente más tarde';
                } else if (error.status >= 500) {
                    errorMessage = 'Error del servidor. Intente nuevamente más tarde';
                } else if (error.status >= 400) {
                    errorMessage = 'Error en la solicitud de datos de estaciones';
                }

                return throwError(() => new Error(errorMessage));
            })
        );
    }

    /**
     * Transform the API response to our data model
     * @param stations The stations data from the API
     * @returns Transformed data in our app's format
     */
    private transformStationsData(stations: Root[]): FuelPricesData {
        if (!stations || stations.length === 0) throw new Error('No stations data received');

        // Calculate distance and transform data
        const stationsWithDistance = stations.map(station => {
            const stationLat = parseFloat(station.ubicacion.latitud);
            const stationLng = parseFloat(station.ubicacion.longitud);

            // Calculate distance between user and station
            const distance = this.calculateDistance(
                this.userLatitude,
                this.userLongitude,
                stationLat,
                stationLng
            );

            // Extract all fuel prices
            const prices: FuelPrice[] = [];

            // Check each fuel type and add it to the prices array if available

            if (station.precios?.['93']) {
                prices.push({
                    fuelType: '93',
                    price   : parseFloat(station.precios['93'].precio)
                });
            }

            if (station.precios?.['95']) {
                prices.push({
                    fuelType: '95',
                    price   : parseFloat(station.precios['95'].precio)
                });
            }

            if (station.precios?.['97']) {
                prices.push({
                    fuelType: '97',
                    price   : parseFloat(station.precios['97'].precio)
                });
            }

            if (station.precios?.DI) {
                prices.push({
                    fuelType: 'Diesel',
                    price   : parseFloat(station.precios.DI.precio)
                });
            }

            if (!distance) {
                console.warn(`Station ${ station.razon_social } has invalid coordinates: ${ stationLat }, ${ stationLng }`);
                return null; // Skip this station if coordinates are invalid
            }

            return {
                name   : station.distribuidor.marca,
                address: `${ station.ubicacion.direccion }, ${ station.ubicacion.nombre_comuna }`,
                distance,
                prices,
                latitude : stationLat,
                longitude: stationLng,
                brand    : station.distribuidor.marca, // Add brand for grouping
            } as GasStation & { brand: string }; // Extend GasStation with brand
        });

        // Filter stations by maximum distance if specified
        const filteredStations = this.maxDistance > 0
            ? stationsWithDistance.filter(station => station.distance <= this.maxDistance)
            : stationsWithDistance;

        // Sort all stations by distance
        const sortedStations = filteredStations.sort((a, b) => a.distance - b.distance);

        // Group stations by brand and select the nearest one for each brand
        const brandMap = new Map<string, GasStation>();

        // Populate the map with the nearest station of each brand
        sortedStations.forEach(station => {
            if (!brandMap.has(station.brand)) {
                // Remove the temporary brand property before adding to the result
                const {brand, ...stationWithoutBrand} = station;
                brandMap.set(brand, stationWithoutBrand);
            }
        });

        // Convert the map values to an array and limit to maxStations
        const uniqueBrandStations = Array.from(brandMap.values()).slice(0, this.maxStations);

        // Calculate average price based on the selected stations using the 95 fuel type if available
        // or the first available fuel type for each station
        let totalPrice = 0;
        let count = 0;

        uniqueBrandStations.forEach(station => {
            // Try to find the 95 fuel type first
            const fuelPrice95 = station.prices.find(p => p.fuelType === '95');

            if (fuelPrice95) {
                totalPrice += fuelPrice95.price;
                count++;
            } else if (station.prices.length > 0) {
                // If 95 is not available, use the first available fuel type
                totalPrice += station.prices[0].price;
                count++;
            }
        });

        const averagePrice = count > 0 ? totalPrice / count : 0;

        // For demo purposes, using fixed trend data
        return {
            stations   : uniqueBrandStations,
            averagePrice,
            weeklyTrend: {
                percentage: 2.3,
                increasing: true
            },
            lastUpdated: new Date()
        };
    }

    /**
     * Calculate distance between two points using the Haversine formula
     * @param lat1 First point latitude
     * @param lon1 First point longitude
     * @param lat2 Second point latitude
     * @param lon2 Second point longitude
     * @returns Distance in kilometers
     */
    private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
        const R = 6371; // Radius of the earth in km
        const dLat = this.deg2rad(lat2 - lat1);
        const dLon = this.deg2rad(lon2 - lon1);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c; // Distance in km
        return parseFloat(distance.toFixed(1));
    }

    /**
     * Convert degrees to radians
     * @param deg Degrees
     * @returns Radians
     */
    private deg2rad(deg: number): number {
        return deg * (Math.PI / 180);
    }

    // Mock data for development and fallback
    getMockFuelPrices(): Observable<FuelPricesData> {
        const mockData: FuelPricesData = {
            stations    : [
                {
                    name    : 'Gasolinera PEMEX',
                    address : 'Av. Principal 123',
                    distance: 1.2,
                    prices  : [
                        {fuelType: '95', price: 21.45},
                        {fuelType: '93', price: 20.95},
                        {fuelType: '97', price: 22.15},
                        {fuelType: 'Diesel', price: 19.85}
                    ]
                },
                {
                    name    : 'Gasolinera Shell',
                    address : 'Calle Secundaria 456',
                    distance: 2.5,
                    prices  : [
                        {fuelType: '95', price: 21.89},
                        {fuelType: '93', price: 21.25},
                        {fuelType: '97', price: 22.50},
                        {fuelType: 'Diesel', price: 20.10}
                    ]
                },
                {
                    name    : 'Gasolinera BP',
                    address : 'Blvd. Principal 789',
                    distance: 3.8,
                    prices  : [
                        {fuelType: '95', price: 21.35},
                        {fuelType: '93', price: 20.85},
                        {fuelType: '97', price: 22.05},
                        {fuelType: 'Diesel', price: 19.75}
                    ]
                }
            ],
            averagePrice: 21.56,
            weeklyTrend : {
                percentage: 2.3,
                increasing: true
            },
            lastUpdated : new Date()
        };

        return of(mockData);
    }
}
