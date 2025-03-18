const alpha3ToAlpha2 = {
    AFG: 'AF', ALB: 'AL', DZA: 'DZ', ASM: 'AS', AND: 'AD', AGO: 'AO', ATG: 'AG', ARG: 'AR', ARM: 'AM', ABW: 'AW',
    AUS: 'AU', AUT: 'AT', AZE: 'AZ', BHS: 'BS', BHR: 'BH', BGD: 'BD', BRB: 'BB', BLR: 'BY', BEL: 'BE', BLZ: 'BZ',
    BEN: 'BJ', BMU: 'BM', BTN: 'BT', BOL: 'BO', BIH: 'BA', BWA: 'BW', BRA: 'BR', BRN: 'BN', BGR: 'BG', BUL: 'BG', BFA: 'BF',
    BDI: 'BI', CPV: 'CV', KHM: 'KH', CMR: 'CM', CAN: 'CA', CAF: 'CF', TCD: 'TD', CHL: 'CL', CHN: 'CN', COL: 'CO',
    COM: 'KM', COG: 'CG', CRI: 'CR', HRV: 'HR', CRO: 'HR', CUB: 'CU', CYP: 'CY', CZE: 'CZ', COD: 'CD', DNK: 'DK', DEN: 'DK',
    DJI: 'DJ', DMA: 'DM', DOM: 'DO', ECU: 'EC', EGY: 'EG', SLV: 'SV', GNQ: 'GQ', ERI: 'ER', EST: 'EE', SWZ: 'SZ', ETH: 'ET',
    FJI: 'FJ', FIN: 'FI', FRA: 'FR', GAB: 'GA', GMB: 'GM', GEO: 'GE', DEU: 'DE', GER: 'DE', GHA: 'GH', GRC: 'GR', GRE: 'GR',
    GRD: 'GD', GTM: 'GT', GIN: 'GN', GNB: 'GW', GUY: 'GY', HTI: 'HT', HND: 'HN', HUN: 'HU', ISL: 'IS', IND: 'IN',
    IDN: 'ID', IRN: 'IR', IRQ: 'IQ', IRL: 'IE', ISR: 'IL', ITA: 'IT', JAM: 'JM', JPN: 'JP', JOR: 'JO', KAZ: 'KZ',
    KEN: 'KE', KIR: 'KI', KWT: 'KW', KGZ: 'KG', LAO: 'LA', LVA: 'LV', LBN: 'LB', LSO: 'LS', LBR: 'LR', LBY: 'LY',
    LIE: 'LI', LTU: 'LT', LUX: 'LU', MDG: 'MG', MWI: 'MW', MYS: 'MY', MDV: 'MV', MLI: 'ML', MLT: 'MT', MHL: 'MH',
    MRT: 'MR', MUS: 'MU', MEX: 'MX', FSM: 'FM', MDA: 'MD', MCO: 'MC', MNG: 'MN', MNE: 'ME', MAR: 'MA', MOZ: 'MZ',
    MMR: 'MM', NAM: 'NA', NRU: 'NR', NPL: 'NP', NLD: 'NL', NED: 'NL', NZL: 'NZ', NIC: 'NI', NER: 'NE', NGA: 'NG', PRK: 'KP',
    MKD: 'MK', NOR: 'NO', OMN: 'OM', PAK: 'PK', PLW: 'PW', PAN: 'PA', PNG: 'PG', PRY: 'PY', PER: 'PE', PHL: 'PH',
    POL: 'PL', PRT: 'PT', QAT: 'QA', ROU: 'RO', RUS: 'RU', RWA: 'RW', KNA: 'KN', LCA: 'LC', VCT: 'VC', WSM: 'WS',
    SMR: 'SM', STP: 'ST', SAU: 'SA', SEN: 'SN', SRB: 'RS', SYC: 'SC', SLE: 'SL', SGP: 'SG', SVK: 'SK', SVN: 'SI',
    SLO: 'SI', SLB: 'SB', SOM: 'SO', ZAF: 'ZA', KOR: 'KR', SSD: 'SS', ESP: 'ES', LKA: 'LK', SDN: 'SD', SUR: 'SR', SWE: 'SE',
    CHE: 'CH', SUI: 'CH', SYR: 'SY', TJK: 'TJ', THA: 'TH', TLS: 'TL', TGO: 'TG', TON: 'TO', TTO: 'TT', TUN: 'TN',
    TUR: 'TR', TKM: 'TM', TUV: 'TV', UGA: 'UG', UKR: 'UA', ARE: 'AE', GBR: 'GB', ENG: 'GB', USA: 'US', URY: 'UY', UZB: 'UZ',
    VUT: 'VU', VAT: 'VA', VEN: 'VE', VNM: 'VN', YEM: 'YE', ZMB: 'ZM', ZWE: 'ZW'
};

export function getEmojiFlag(alpha3) {
    const alpha2 = alpha3ToAlpha2[alpha3.toUpperCase()];
    if (!alpha2) {
        console.log('Usao sam ovde', alpha3)
        return alpha3;
    }
    return [...alpha2.toUpperCase()].map(char => String.fromCodePoint(0x1F1E6 + char.charCodeAt(0) - 65)).join('');
}