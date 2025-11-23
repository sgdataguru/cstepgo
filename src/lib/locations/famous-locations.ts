// Famous locations in Kazakhstan and Kyrgyzstan for autocomplete

export interface FamousLocation {
  id: string;
  name: string;
  type: 'CITY' | 'LANDMARK' | 'AIRPORT' | 'ATTRACTION';
  country: 'Kazakhstan' | 'Kyrgyzstan' | 'Uzbekistan';
  latitude: number;
  longitude: number;
  isFamous: boolean;
  searchTerms?: string[]; // Alternative names for searching
}

export const famousLocations: FamousLocation[] = [
  // Kazakhstan - Major Cities
  {
    id: 'almaty',
    name: 'Almaty',
    type: 'CITY',
    country: 'Kazakhstan',
    latitude: 43.2220,
    longitude: 76.8512,
    isFamous: true,
    searchTerms: ['alma-ata']
  },
  {
    id: 'nur-sultan',
    name: 'Astana (Nur-Sultan)',
    type: 'CITY',
    country: 'Kazakhstan',
    latitude: 51.1694,
    longitude: 71.4491,
    isFamous: true,
    searchTerms: ['astana', 'nur-sultan', 'nursultan']
  },
  {
    id: 'shymkent',
    name: 'Shymkent',
    type: 'CITY',
    country: 'Kazakhstan',
    latitude: 42.3417,
    longitude: 69.5901,
    isFamous: true
  },
  {
    id: 'karaganda',
    name: 'Karaganda',
    type: 'CITY',
    country: 'Kazakhstan',
    latitude: 49.8047,
    longitude: 73.1094,
    isFamous: true
  },
  {
    id: 'aktobe',
    name: 'Aktobe',
    type: 'CITY',
    country: 'Kazakhstan',
    latitude: 50.2839,
    longitude: 57.1670,
    isFamous: true
  },

  // Kazakhstan - Airports
  {
    id: 'almaty-airport',
    name: 'Almaty International Airport',
    type: 'AIRPORT',
    country: 'Kazakhstan',
    latitude: 43.3521,
    longitude: 77.0405,
    isFamous: true,
    searchTerms: ['ala', 'almaty airport']
  },
  {
    id: 'astana-airport',
    name: 'Nursultan Nazarbayev International Airport',
    type: 'AIRPORT',
    country: 'Kazakhstan',
    latitude: 51.0222,
    longitude: 71.4669,
    isFamous: true,
    searchTerms: ['tse', 'astana airport', 'nur-sultan airport']
  },

  // Kazakhstan - Attractions
  {
    id: 'charyn-canyon',
    name: 'Charyn Canyon',
    type: 'ATTRACTION',
    country: 'Kazakhstan',
    latitude: 43.3458,
    longitude: 79.0906,
    isFamous: true
  },
  {
    id: 'big-almaty-lake',
    name: 'Big Almaty Lake',
    type: 'ATTRACTION',
    country: 'Kazakhstan',
    latitude: 43.0556,
    longitude: 76.9900,
    isFamous: true
  },
  {
    id: 'medeu',
    name: 'Medeu',
    type: 'ATTRACTION',
    country: 'Kazakhstan',
    latitude: 43.1622,
    longitude: 77.0800,
    isFamous: true
  },
  {
    id: 'shymbulak',
    name: 'Shymbulak Ski Resort',
    type: 'ATTRACTION',
    country: 'Kazakhstan',
    latitude: 43.1381,
    longitude: 77.0658,
    isFamous: true
  },
  {
    id: 'kolsai-lakes',
    name: 'Kolsai Lakes',
    type: 'ATTRACTION',
    country: 'Kazakhstan',
    latitude: 42.9667,
    longitude: 78.3333,
    isFamous: true
  },
  {
    id: 'kaindy-lake',
    name: 'Kaindy Lake',
    type: 'ATTRACTION',
    country: 'Kazakhstan',
    latitude: 42.9939,
    longitude: 78.4850,
    isFamous: true
  },
  {
    id: 'kok-tobe-hill',
    name: 'Kök Töbe Hill',
    type: 'ATTRACTION',
    country: 'Kazakhstan',
    latitude: 43.2304,
    longitude: 76.9569,
    isFamous: true,
    searchTerms: ['koktobe', 'kok tobe', 'cable car almaty']
  },
  {
    id: 'green-bazaar-almaty',
    name: 'Green Bazaar',
    type: 'ATTRACTION',
    country: 'Kazakhstan',
    latitude: 43.2600,
    longitude: 76.9497,
    isFamous: true,
    searchTerms: ['zelyony bazaar', 'almaty market']
  },
  {
    id: 'panfilov-park',
    name: 'Panfilov Park',
    type: 'ATTRACTION',
    country: 'Kazakhstan',
    latitude: 43.2589,
    longitude: 76.9514,
    isFamous: true,
    searchTerms: ['28 panfilov guardsmen park']
  },
  {
    id: 'zenkov-cathedral',
    name: 'Zenkov Cathedral',
    type: 'LANDMARK',
    country: 'Kazakhstan',
    latitude: 43.2589,
    longitude: 76.9511,
    isFamous: true,
    searchTerms: ['ascension cathedral', 'wooden cathedral almaty']
  },
  {
    id: 'almaty-central-mosque',
    name: 'Almaty Central Mosque',
    type: 'LANDMARK',
    country: 'Kazakhstan',
    latitude: 43.2557,
    longitude: 76.9444,
    isFamous: true
  },
  {
    id: 'central-state-museum-almaty',
    name: 'Central State Museum of Kazakhstan',
    type: 'LANDMARK',
    country: 'Kazakhstan',
    latitude: 43.2386,
    longitude: 76.9631,
    isFamous: true,
    searchTerms: ['almaty museum']
  },
  {
    id: 'altyn-emel-national-park',
    name: 'Altyn-Emel National Park',
    type: 'ATTRACTION',
    country: 'Kazakhstan',
    latitude: 43.7167,
    longitude: 78.5833,
    isFamous: true,
    searchTerms: ['singing dunes', 'aktau mountains']
  },
  {
    id: 'first-presidents-park-almaty',
    name: "First President's Park",
    type: 'ATTRACTION',
    country: 'Kazakhstan',
    latitude: 43.2333,
    longitude: 76.9581,
    isFamous: true,
    searchTerms: ['presidents park almaty']
  },
  {
    id: 'kok-zhailau',
    name: 'Kok-Zhailau',
    type: 'ATTRACTION',
    country: 'Kazakhstan',
    latitude: 43.1500,
    longitude: 77.0500,
    isFamous: true,
    searchTerms: ['mountain plateau almaty']
  },
  {
    id: 'baiterek-tower',
    name: 'Baiterek Tower',
    type: 'LANDMARK',
    country: 'Kazakhstan',
    latitude: 51.1286,
    longitude: 71.4306,
    isFamous: true,
    searchTerms: ['bayterek', 'astana tower']
  },
  {
    id: 'hazrat-sultan-mosque',
    name: 'Hazrat Sultan Mosque',
    type: 'LANDMARK',
    country: 'Kazakhstan',
    latitude: 51.1253,
    longitude: 71.4619,
    isFamous: true,
    searchTerms: ['astana mosque', 'largest mosque central asia']
  },
  {
    id: 'palace-of-peace-reconciliation',
    name: 'Palace of Peace and Reconciliation',
    type: 'LANDMARK',
    country: 'Kazakhstan',
    latitude: 51.1272,
    longitude: 71.4647,
    isFamous: true,
    searchTerms: ['pyramid astana', 'foster pyramid']
  },
  {
    id: 'khan-shatyr',
    name: 'Khan Shatyr Entertainment Center',
    type: 'ATTRACTION',
    country: 'Kazakhstan',
    latitude: 51.1328,
    longitude: 71.4042,
    isFamous: true,
    searchTerms: ['khan shatyr mall', 'astana shopping']
  },
  {
    id: 'expo-2017-sphere',
    name: 'EXPO 2017 Sphere (Nur Alem Museum)',
    type: 'LANDMARK',
    country: 'Kazakhstan',
    latitude: 51.0889,
    longitude: 71.4664,
    isFamous: true,
    searchTerms: ['nur alem', 'astana expo', 'energy museum']
  },
  {
    id: 'astana-opera',
    name: 'Astana Opera House',
    type: 'LANDMARK',
    country: 'Kazakhstan',
    latitude: 51.1267,
    longitude: 71.4597,
    isFamous: true,
    searchTerms: ['opera astana']
  },
  {
    id: 'burabay-national-park',
    name: 'Burabay National Park',
    type: 'ATTRACTION',
    country: 'Kazakhstan',
    latitude: 53.0833,
    longitude: 70.2833,
    isFamous: true,
    searchTerms: ['borovoe', 'burabai', 'lake burabay']
  },
  {
    id: 'nur-astana-mosque',
    name: 'Nur-Astana Mosque',
    type: 'LANDMARK',
    country: 'Kazakhstan',
    latitude: 51.1281,
    longitude: 71.4303,
    isFamous: true
  },
  {
    id: 'independence-square-astana',
    name: 'Independence Square',
    type: 'ATTRACTION',
    country: 'Kazakhstan',
    latitude: 51.1667,
    longitude: 71.4167,
    isFamous: true,
    searchTerms: ['astana square']
  },
  {
    id: 'national-museum-kazakhstan',
    name: 'National Museum of the Republic of Kazakhstan',
    type: 'LANDMARK',
    country: 'Kazakhstan',
    latitude: 51.1286,
    longitude: 71.4717,
    isFamous: true,
    searchTerms: ['astana museum']
  },
  {
    id: 'aktau-city',
    name: 'Aktau',
    type: 'CITY',
    country: 'Kazakhstan',
    latitude: 43.6508,
    longitude: 51.1600,
    isFamous: true
  },
  {
    id: 'caspian-sea-promenade',
    name: 'Caspian Sea Promenade',
    type: 'ATTRACTION',
    country: 'Kazakhstan',
    latitude: 43.6500,
    longitude: 51.1700,
    isFamous: true,
    searchTerms: ['aktau seafront', 'caspian beach']
  },
  {
    id: 'aktau-lighthouse',
    name: 'Aktau Lighthouse & Rock Trail',
    type: 'ATTRACTION',
    country: 'Kazakhstan',
    latitude: 43.6800,
    longitude: 51.1900,
    isFamous: true,
    searchTerms: ['lighthouse aktau']
  },
  {
    id: 'bozzhyra-canyon',
    name: 'Bosphorus Canyon (Bozzhyra)',
    type: 'ATTRACTION',
    country: 'Kazakhstan',
    latitude: 43.8333,
    longitude: 54.5000,
    isFamous: true,
    searchTerms: ['bozzhyra', 'mangystau canyon']
  },
  {
    id: 'valley-of-balls',
    name: 'Valley of Balls (Torysh)',
    type: 'ATTRACTION',
    country: 'Kazakhstan',
    latitude: 43.5833,
    longitude: 54.4167,
    isFamous: true,
    searchTerms: ['torysh', 'stone balls mangystau']
  },
  {
    id: 'zhygylgan-fault',
    name: 'Zhygylgan Fault',
    type: 'ATTRACTION',
    country: 'Kazakhstan',
    latitude: 43.6667,
    longitude: 54.0833,
    isFamous: true,
    searchTerms: ['mangystau fault']
  },
  {
    id: 'shakpak-ata-mosque',
    name: 'Shakpak Ata Underground Mosque',
    type: 'LANDMARK',
    country: 'Kazakhstan',
    latitude: 43.4167,
    longitude: 53.0000,
    isFamous: true,
    searchTerms: ['underground mosque mangystau']
  },
  {
    id: 'karagiye-depression',
    name: 'Karagiye Depression',
    type: 'ATTRACTION',
    country: 'Kazakhstan',
    latitude: 43.4167,
    longitude: 51.8333,
    isFamous: true,
    searchTerms: ['lowest point kazakhstan']
  },
  {
    id: 'aktau-eternal-flame',
    name: 'Eternal Flame Monument',
    type: 'LANDMARK',
    country: 'Kazakhstan',
    latitude: 43.6400,
    longitude: 51.1500,
    isFamous: true,
    searchTerms: ['aktau monument']
  },

  // Kyrgyzstan - Major Cities
  {
    id: 'bishkek',
    name: 'Bishkek',
    type: 'CITY',
    country: 'Kyrgyzstan',
    latitude: 42.8746,
    longitude: 74.5698,
    isFamous: true
  },
  {
    id: 'osh',
    name: 'Osh',
    type: 'CITY',
    country: 'Kyrgyzstan',
    latitude: 40.5283,
    longitude: 72.7985,
    isFamous: true
  },
  {
    id: 'jalal-abad',
    name: 'Jalal-Abad',
    type: 'CITY',
    country: 'Kyrgyzstan',
    latitude: 40.9333,
    longitude: 73.0000,
    isFamous: true,
    searchTerms: ['jalalabad', 'dzhalal-abad']
  },
  {
    id: 'karakol',
    name: 'Karakol',
    type: 'CITY',
    country: 'Kyrgyzstan',
    latitude: 42.4908,
    longitude: 78.3936,
    isFamous: true
  },

  // Kyrgyzstan - Airports
  {
    id: 'bishkek-airport',
    name: 'Manas International Airport',
    type: 'AIRPORT',
    country: 'Kyrgyzstan',
    latitude: 43.0621,
    longitude: 74.4776,
    isFamous: true,
    searchTerms: ['fru', 'bishkek airport', 'manas']
  },

  // Kyrgyzstan - Attractions
  {
    id: 'issyk-kul',
    name: 'Issyk-Kul Lake',
    type: 'ATTRACTION',
    country: 'Kyrgyzstan',
    latitude: 42.4167,
    longitude: 77.2500,
    isFamous: true,
    searchTerms: ['issyk kul', 'issykkul']
  },
  {
    id: 'ala-archa',
    name: 'Ala Archa National Park',
    type: 'ATTRACTION',
    country: 'Kyrgyzstan',
    latitude: 42.6333,
    longitude: 74.5000,
    isFamous: true
  },
  {
    id: 'song-kul',
    name: 'Song-Kul Lake',
    type: 'ATTRACTION',
    country: 'Kyrgyzstan',
    latitude: 41.8333,
    longitude: 75.1333,
    isFamous: true,
    searchTerms: ['song kul', 'songkul']
  },
  {
    id: 'tash-rabat',
    name: 'Tash Rabat',
    type: 'LANDMARK',
    country: 'Kyrgyzstan',
    latitude: 40.3167,
    longitude: 75.3167,
    isFamous: true
  },
  {
    id: 'burana-tower',
    name: 'Burana Tower',
    type: 'LANDMARK',
    country: 'Kyrgyzstan',
    latitude: 42.8986,
    longitude: 75.2586,
    isFamous: true
  },
  {
    id: 'ala-too-square',
    name: 'Ala-Too Square',
    type: 'ATTRACTION',
    country: 'Kyrgyzstan',
    latitude: 42.8746,
    longitude: 74.6067,
    isFamous: true,
    searchTerms: ['central square bishkek']
  },
  {
    id: 'osh-bazaar',
    name: 'Osh Bazaar',
    type: 'ATTRACTION',
    country: 'Kyrgyzstan',
    latitude: 42.8719,
    longitude: 74.5856,
    isFamous: true,
    searchTerms: ['osh market bishkek']
  },
  {
    id: 'victory-square-bishkek',
    name: 'Victory Square',
    type: 'LANDMARK',
    country: 'Kyrgyzstan',
    latitude: 42.8650,
    longitude: 74.5850,
    isFamous: true,
    searchTerms: ['pobedy square']
  },
  {
    id: 'state-historical-museum-bishkek',
    name: 'State Historical Museum',
    type: 'LANDMARK',
    country: 'Kyrgyzstan',
    latitude: 42.8753,
    longitude: 74.6069,
    isFamous: true,
    searchTerms: ['bishkek museum']
  },
  {
    id: 'kyrgyz-national-opera-ballet',
    name: 'Kyrgyz National Opera and Ballet Theatre',
    type: 'LANDMARK',
    country: 'Kyrgyzstan',
    latitude: 42.8739,
    longitude: 74.6100,
    isFamous: true,
    searchTerms: ['opera bishkek']
  },
  {
    id: 'philharmonic-hall-bishkek',
    name: 'Philharmonic Hall',
    type: 'LANDMARK',
    country: 'Kyrgyzstan',
    latitude: 42.8744,
    longitude: 74.6064,
    isFamous: true,
    searchTerms: ['concert hall bishkek']
  },
  {
    id: 'erkindik-boulevard',
    name: 'Erkindik Boulevard',
    type: 'ATTRACTION',
    country: 'Kyrgyzstan',
    latitude: 42.8750,
    longitude: 74.6050,
    isFamous: true,
    searchTerms: ['freedom boulevard bishkek']
  },
  {
    id: 'oak-park-bishkek',
    name: 'Oak Park',
    type: 'ATTRACTION',
    country: 'Kyrgyzstan',
    latitude: 42.8728,
    longitude: 74.6083,
    isFamous: true,
    searchTerms: ['dubovy park']
  },

  // Uzbekistan - Major Cities
  {
    id: 'samarkand',
    name: 'Samarkand',
    type: 'CITY',
    country: 'Uzbekistan',
    latitude: 39.6542,
    longitude: 66.9597,
    isFamous: true,
    searchTerms: ['samarqand']
  },
  {
    id: 'tashkent',
    name: 'Tashkent',
    type: 'CITY',
    country: 'Uzbekistan',
    latitude: 41.2995,
    longitude: 69.2401,
    isFamous: true,
    searchTerms: ['toshkent']
  },

  // Uzbekistan - Samarkand Attractions
  {
    id: 'registan-square',
    name: 'Registan Square',
    type: 'LANDMARK',
    country: 'Uzbekistan',
    latitude: 39.6547,
    longitude: 66.9750,
    isFamous: true,
    searchTerms: ['registon', 'samarkand square', 'timurid madrasas']
  },
  {
    id: 'shah-i-zinda',
    name: 'Shah-i-Zinda Necropolis',
    type: 'LANDMARK',
    country: 'Uzbekistan',
    latitude: 39.6711,
    longitude: 66.9856,
    isFamous: true,
    searchTerms: ['shahi zinda', 'blue mausoleums']
  },
  {
    id: 'gur-emir-mausoleum',
    name: 'Gur-Emir Mausoleum',
    type: 'LANDMARK',
    country: 'Uzbekistan',
    latitude: 39.6481,
    longitude: 66.9731,
    isFamous: true,
    searchTerms: ['timur tomb', 'guri amir']
  },
  {
    id: 'bibi-khanym-mosque',
    name: 'Bibi-Khanym Mosque',
    type: 'LANDMARK',
    country: 'Uzbekistan',
    latitude: 39.6592,
    longitude: 66.9822,
    isFamous: true,
    searchTerms: ['bibi khanum']
  },
  {
    id: 'siab-bazaar',
    name: 'Siab Bazaar',
    type: 'ATTRACTION',
    country: 'Uzbekistan',
    latitude: 39.6600,
    longitude: 66.9814,
    isFamous: true,
    searchTerms: ['samarkand market']
  },
  {
    id: 'ulugh-beg-observatory',
    name: 'Ulugh Beg Observatory',
    type: 'LANDMARK',
    country: 'Uzbekistan',
    latitude: 39.6747,
    longitude: 66.9856,
    isFamous: true,
    searchTerms: ['ulugbek observatory', 'medieval observatory']
  },
  {
    id: 'afrasiyab-museum',
    name: 'Afrasiyab Museum',
    type: 'LANDMARK',
    country: 'Uzbekistan',
    latitude: 39.6717,
    longitude: 66.9856,
    isFamous: true,
    searchTerms: ['samarkand museum', 'afrosiyob']
  },
  {
    id: 'hazrat-khizr-mosque',
    name: 'Hazrat Khizr Mosque',
    type: 'LANDMARK',
    country: 'Uzbekistan',
    latitude: 39.6669,
    longitude: 66.9778,
    isFamous: true,
    searchTerms: ['khizr mosque samarkand']
  },
  {
    id: 'imam-al-bukhari-complex',
    name: 'Imam al-Bukhari Complex',
    type: 'LANDMARK',
    country: 'Uzbekistan',
    latitude: 39.7544,
    longitude: 66.8858,
    isFamous: true,
    searchTerms: ['bukhari shrine']
  },
  {
    id: 'samarkand-silk-paper-factory',
    name: 'Samarkand Silk Paper Factory',
    type: 'ATTRACTION',
    country: 'Uzbekistan',
    latitude: 39.6500,
    longitude: 66.9600,
    isFamous: true,
    searchTerms: ['paper making samarkand']
  },

  // Uzbekistan - Tashkent Attractions
  {
    id: 'khast-imam-complex',
    name: 'Khast-Imam Complex',
    type: 'LANDMARK',
    country: 'Uzbekistan',
    latitude: 41.3267,
    longitude: 69.2822,
    isFamous: true,
    searchTerms: ['hazrati imam', 'bukhari library tashkent']
  },
  {
    id: 'chorsu-bazaar',
    name: 'Chorsu Bazaar',
    type: 'ATTRACTION',
    country: 'Uzbekistan',
    latitude: 41.3269,
    longitude: 69.2347,
    isFamous: true,
    searchTerms: ['tashkent market']
  },
  {
    id: 'amir-timur-square',
    name: 'Amir Timur Square',
    type: 'ATTRACTION',
    country: 'Uzbekistan',
    latitude: 41.3111,
    longitude: 69.2797,
    isFamous: true,
    searchTerms: ['timur square tashkent']
  },
  {
    id: 'minor-mosque-tashkent',
    name: 'Minor Mosque',
    type: 'LANDMARK',
    country: 'Uzbekistan',
    latitude: 41.3250,
    longitude: 69.2400,
    isFamous: true,
    searchTerms: ['white mosque tashkent']
  },
  {
    id: 'tashkent-city-park',
    name: 'Tashkent City Park',
    type: 'ATTRACTION',
    country: 'Uzbekistan',
    latitude: 41.3200,
    longitude: 69.2900,
    isFamous: true,
    searchTerms: ['city park tashkent']
  },
  {
    id: 'tashkent-tv-tower',
    name: 'Tashkent TV Tower',
    type: 'LANDMARK',
    country: 'Uzbekistan',
    latitude: 41.3331,
    longitude: 69.2894,
    isFamous: true,
    searchTerms: ['tv tower observation deck']
  },
  {
    id: 'state-museum-history-uzbekistan',
    name: 'State Museum of History of Uzbekistan',
    type: 'LANDMARK',
    country: 'Uzbekistan',
    latitude: 41.3111,
    longitude: 69.2811,
    isFamous: true,
    searchTerms: ['national museum tashkent']
  },
  {
    id: 'broadway-street-tashkent',
    name: 'Broadway Street (Sailgokh)',
    type: 'ATTRACTION',
    country: 'Uzbekistan',
    latitude: 41.3092,
    longitude: 69.2789,
    isFamous: true,
    searchTerms: ['broadway tashkent', 'sailgokh']
  },
  {
    id: 'japanese-garden-tashkent',
    name: 'Japanese Garden',
    type: 'ATTRACTION',
    country: 'Uzbekistan',
    latitude: 41.3472,
    longitude: 69.3397,
    isFamous: true,
    searchTerms: ['japanese garden tashkent']
  },
  {
    id: 'magic-city-amusement-park',
    name: 'Magic City Amusement Park',
    type: 'ATTRACTION',
    country: 'Uzbekistan',
    latitude: 41.3700,
    longitude: 69.3300,
    isFamous: true,
    searchTerms: ['amusement park tashkent', 'magic city']
  }
];

// Search function with fuzzy matching
export function searchLocations(query: string, limit: number = 8): FamousLocation[] {
  const lowerQuery = query.toLowerCase().trim();
  
  if (lowerQuery.length < 2) {
    return [];
  }

  return famousLocations
    .filter(location => {
      const nameMatch = location.name.toLowerCase().includes(lowerQuery);
      const searchTermsMatch = location.searchTerms?.some(term => 
        term.toLowerCase().includes(lowerQuery)
      );
      return nameMatch || searchTermsMatch;
    })
    .sort((a, b) => {
      // Famous locations first
      if (a.isFamous && !b.isFamous) return -1;
      if (!a.isFamous && b.isFamous) return 1;
      
      // Cities before other types
      if (a.type === 'CITY' && b.type !== 'CITY') return -1;
      if (a.type !== 'CITY' && b.type === 'CITY') return 1;
      
      // Alphabetical
      return a.name.localeCompare(b.name);
    })
    .slice(0, limit);
}

// Get popular locations for quick suggestions
export function getPopularLocations(limit: number = 10): FamousLocation[] {
  return famousLocations
    .filter(location => location.isFamous && location.type === 'CITY')
    .slice(0, limit);
}
