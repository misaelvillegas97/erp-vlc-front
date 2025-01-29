export interface Place {
    address: Location;
    place_id: number;
    licence: string;
    osm_type: string;
    osm_id: number;
    lat: string;
    lon: string;
    class: string;
    type: string;
    place_rank: number;
    importance: number;
    addresstype: string;
    name: string;
    display_name: string;
    boundingbox: string[];
}

export interface Location {
    amenity: string;
    house_number: string;
    road: string;
    neighbourhood: string;
    city: string;
    county: string;
    state: string;
    'ISO3166-2-lvl4': string;
    postcode: string;
    country: string;
    country_code: string;
}

export interface ReadablePlace {
    address: string;
    postcode: string;
    lat: string;
    lon: string;
    location: Location;
}
