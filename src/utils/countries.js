const alpha3ToAlpha2 = {
    AFG: 'AF', ALB: 'AL', DZA: 'DZ', ASM: 'AS', AND: 'AD', AGO: 'AO', ATG: 'AG', ARG: 'AR', ARM: 'AM', ABW: 'AW',
    AUS: 'AU', AUT: 'AT', AZE: 'AZ', BHS: 'BS', BHR: 'BH', BGD: 'BD', BRB: 'BB', BLR: 'BY', BEL: 'BE', BLZ: 'BZ',
    BEN: 'BJ', BMU: 'BM', BTN: 'BT', BOL: 'BO', BIH: 'BA', BWA: 'BW', BRA: 'BR', BRN: 'BN', BGR: 'BG', BUL: 'BG',
    BDI: 'BI', CPV: 'CV', KHM: 'KH', CMR: 'CM', CAN: 'CA', CAF: 'CF', TCD: 'TD', CHL: 'CL', CHN: 'CN', COL: 'CO',
    COM: 'KM', COG: 'CG', CRI: 'CR', HRV: 'HR', CRO: 'HR', CUB: 'CU', CYP: 'CY', CZE: 'CZ', COD: 'CD', DNK: 'DK',
    DJI: 'DJ', DMA: 'DM', DOM: 'DO', ECU: 'EC', EGY: 'EG', SLV: 'SV', GNQ: 'GQ', ERI: 'ER', EST: 'EE', SWZ: 'SZ',
    FJI: 'FJ', FIN: 'FI', FRA: 'FR', GAB: 'GA', GMB: 'GM', GEO: 'GE', DEU: 'DE', GER: 'DE', GHA: 'GH', GRC: 'GR',
    GRD: 'GD', GTM: 'GT', GIN: 'GN', GNB: 'GW', GUY: 'GY', HTI: 'HT', HND: 'HN', HUN: 'HU', ISL: 'IS', IND: 'IN',
    IDN: 'ID', IRN: 'IR', IRQ: 'IQ', IRL: 'IE', ISR: 'IL', ITA: 'IT', JAM: 'JM', JPN: 'JP', JOR: 'JO', KAZ: 'KZ',
    KEN: 'KE', KIR: 'KI', KWT: 'KW', KGZ: 'KG', LAO: 'LA', LVA: 'LV', LBN: 'LB', LSO: 'LS', LBR: 'LR', LBY: 'LY',
    LIE: 'LI', LTU: 'LT', LUX: 'LU', MDG: 'MG', MWI: 'MW', MYS: 'MY', MDV: 'MV', MLI: 'ML', MLT: 'MT', MHL: 'MH',
    MRT: 'MR', MUS: 'MU', MEX: 'MX', FSM: 'FM', MDA: 'MD', MCO: 'MC', MNG: 'MN', MNE: 'ME', MAR: 'MA', MOZ: 'MZ',
    MMR: 'MM', NAM: 'NA', NRU: 'NR', NPL: 'NP', NLD: 'NL', NED: 'NL', NZL: 'NZ', NIC: 'NI', NER: 'NE', NGA: 'NG',
    MKD: 'MK', NOR: 'NO', OMN: 'OM', PAK: 'PK', PLW: 'PW', PAN: 'PA', PNG: 'PG', PRY: 'PY', PER: 'PE', PHL: 'PH',
    POL: 'PL', PRT: 'PT', QAT: 'QA', ROU: 'RO', RUS: 'RU', RWA: 'RW', KNA: 'KN', LCA: 'LC', VCT: 'VC', WSM: 'WS',
    SMR: 'SM', STP: 'ST', SAU: 'SA', SEN: 'SN', SRB: 'RS', SYC: 'SC', SLE: 'SL', SGP: 'SG', SVK: 'SK', SVN: 'SI',
    SLO: 'SI', SLB: 'SB', SOM: 'SO', ZAF: 'ZA', KOR: 'KR', SSD: 'SS', ESP: 'ES', LKA: 'LK', SDN: 'SD', SUR: 'SR',
    CHE: 'CH', SUI: 'CH', SYR: 'SY', TJK: 'TJ', THA: 'TH', TLS: 'TL', TGO: 'TG', TON: 'TO', TTO: 'TT', TUN: 'TN',
    TUR: 'TR', TKM: 'TM', TUV: 'TV', UGA: 'UG', UKR: 'UA', ARE: 'AE', GBR: 'GB', ENG: 'GB', SCO: 'GB', WAL: 'GB',
    WLS: 'GB', NIR: 'GB', USA: 'US', URY: 'UY', UZB: 'UZ', BFA: 'BF', DEN: 'DK', ETH: 'ET', GRE: 'GR', PRK: 'KP',
    VUT: 'VU', VAT: 'VA', VEN: 'VE', VNM: 'VN', YEM: 'YE', ZMB: 'ZM', ZWE: 'ZW', KOS: 'XK', SWE: 'SE'
};

export function getEmojiFlag(alpha3) {
    const alpha3Upper = alpha3.toUpperCase();

    // Special cases for UK constituent countries
    switch (alpha3Upper) {
        case 'ENG':
            return '🏴󠁧󠁢󠁥󠁮󠁧󠁿'; // England flag (St. George's Cross)
        case 'SCO':
            return '🏴󠁧󠁢󠁳󠁣󠁴󠁿'; // Scotland flag (St. Andrew's Cross)
        case 'WAL':
        case 'WLS':
            return '🏴󠁧󠁢󠁷󠁬󠁳󠁿'; // Wales flag (Red Dragon)
        case 'NIR':
            // Northern Ireland doesn't have an official emoji flag
            // Using the UK flag as fallback since the Ulster Banner isn't in Unicode
            return '🇬🇧'; // UK flag for Northern Ireland
    }

    const alpha2 = alpha3ToAlpha2[alpha3Upper];
    if (!alpha2) {
        console.log('No matching code found:', alpha3Upper);
        return alpha3Upper;
    }

    return [...alpha2.toUpperCase()].map(char =>
        String.fromCodePoint(0x1F1E6 + char.charCodeAt(0) - 65)).join('');
}