export const NISR_DATASET = {
  id: 'RW_LFS2025',
  title: 'Rwanda Labour Force Survey 2025',
  publisher: 'National Institute of Statistics of Rwanda (NISR)',
  sampleSize: 31256,
  variables: [
    {
      variable: 'D23A',
      category: 'Means of transportation to work',
      label: 'Public buses / cars / taxis',
      valuePct: 4.1,
      validN: 1280,
      sampleSize: 31256,
      notes: 'N = 1,280 valid cases out of 31,256 respondents'
    },
    {
      variable: 'D23A',
      category: 'Means of transportation to work',
      label: 'Walking',
      valuePct: 83.7,
      validN: 26169,
      sampleSize: 31256,
      notes: 'Dominant mode of commuting nationally'
    },
    {
      variable: 'D23A',
      category: 'Means of transportation to work',
      label: 'Private motorbike / bicycle / other',
      valuePct: 12.2,
      validN: 3807,
      sampleSize: 31256,
      notes: 'Remainder of the D23A distribution'
    },
    {
      variable: 'D23',
      category: 'Location of work / business',
      label: 'Fixed office / shop / factory',
      valuePct: 22.2,
      validN: 7702,
      sampleSize: 31256,
      notes: 'Stable formal workplace location'
    },
    {
      variable: 'D23',
      category: 'Location of work / business',
      label: 'Construction sites',
      valuePct: 6.9,
      validN: 2391,
      sampleSize: 31256,
      notes: 'Mobile / project-based workforce'
    },
    {
      variable: 'D23',
      category: 'Location of work / business',
      label: 'Market stalls',
      valuePct: 5.1,
      validN: 1775,
      sampleSize: 31256,
      notes: 'Informal trading locations'
    }
  ]
};

export const ROUTES = [
  {
    destination: 'Musanze',
    district: 'Musanze',
    region: 'Northern Province',
    distanceKm: 105,
    durationMin: 120,
    baseFare: 5000,
    regionalMultiplier: 1.35
  },
  {
    destination: 'Huye',
    district: 'Huye',
    region: 'Southern Province',
    distanceKm: 135,
    durationMin: 150,
    baseFare: 6000,
    regionalMultiplier: 1.2
  },
  {
    destination: 'Rubavu',
    district: 'Rubavu',
    region: 'Western Province',
    distanceKm: 155,
    durationMin: 165,
    baseFare: 6500,
    regionalMultiplier: 1.4
  },
  {
    destination: 'Rwamagana',
    district: 'Rwamagana',
    region: 'Eastern Province',
    distanceKm: 55,
    durationMin: 60,
    baseFare: 2500,
    regionalMultiplier: 1.1
  },
  {
    destination: 'Rusizi',
    district: 'Rusizi',
    region: 'Western Province',
    distanceKm: 245,
    durationMin: 260,
    baseFare: 9000,
    regionalMultiplier: 1.25
  }
];

export const COMPANIES = [
  { name: 'Horizon Express', code: 'HZ', color: '#069350', premium: 0 },
  { name: 'Ritco', code: 'RC', color: '#1d4ed8', premium: 300 },
  { name: 'Volcano Express', code: 'VC', color: '#d97706', premium: 500 }
];

export const PASSENGER_NAMES = [
  'Alice Uwase',
  'Eric Nshimiyimana',
  'Diane Mukamana',
  'Jean Claude Habimana',
  'Claudine Uwimana',
  'Patrick Ndayisaba',
  'Sandrine Ingabire',
  'Emmanuel Twagirayezu',
  'Josiane Uwera',
  'Olivier Mugisha',
  'Chantal Nyirahabimana',
  'Fabrice Hakizimana',
  'Beatrice Mukandayisenga',
  'Samuel Bizimana',
  'Aline Uwamahoro',
  'Innocent Nkurunziza',
  'Grace Mutesi',
  'Thierry Munyaneza',
  'Yvonne Umutoni',
  'Didier Nizeyimana'
];

export const DRIVER_NAMES = [
  'Jean Bosco Ntaganda',
  'Augustin Mugabo',
  'Robert Habiyaremye',
  'Fidele Ndayambaje',
  'Moses Karemera',
  'Theogene Nsengimana',
  'Alphonse Murenzi',
  'Vincent Ndagijimana'
];

export const PHONE_NUMBERS = [
  '0788123456',
  '0789456123',
  '0790345678',
  '0722114455',
  '0733225566',
  '0781556677',
  '0792667788',
  '0723778899',
  '0788990011',
  '0734112233'
];
