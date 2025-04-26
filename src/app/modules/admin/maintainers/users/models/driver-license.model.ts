export enum DriverLicenseType {
    A = 'A',
    A1 = 'A1',
    A2 = 'A2',
    A3 = 'A3',
    A4 = 'A4',
    A5 = 'A5',
    B = 'B',
    C = 'C',
    D = 'D',
    E = 'E',
    COMMERCIAL = 'commercial',
    INTERNATIONAL = 'international'
}

export class DriverLicenseDto {
    licenseType: DriverLicenseType;
    licenseValidFrom: Date;
    licenseValidTo: Date;
    restrictions?: string;
    issuingAuthority?: string;
}
