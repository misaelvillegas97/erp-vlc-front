import { Place } from '@shared/domain/model/place';

export interface ClientAddress {
    street: string;
    city: string;
    lat: string;
    long: string;
}

export class ClientAddressMapper {
    static mapFromPlace(place: Place): ClientAddress {
        const address = `${ place.address.road }${ place.address.house_number ? ' #' + place.address.house_number : '' }, ${ place.address.city ?? place.address.town }, ${ place.address.state }, ${ place.address.country }`;

        return {
            street: address,
            city  : place.address.city || place.address.town,
            lat   : place.lat,
            long  : place.lon
        } satisfies ClientAddress;
    }

    static mapFromPlaceArray(places: Place[]): ClientAddress[] {
        return places.map((place) => this.mapFromPlace(place));
    }
}
