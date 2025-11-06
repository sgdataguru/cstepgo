// Famous locations in Kazakhstan and Kyrgyzstan for autocomplete

export interface FamousLocation {
  id: string;
  name: string;
  type: 'CITY' | 'LANDMARK' | 'AIRPORT' | 'ATTRACTION';
  country: 'Kazakhstan' | 'Kyrgyzstan';
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
