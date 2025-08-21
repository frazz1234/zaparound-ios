import { 
  Search, 
  MapPin, 
  Heart, 
  Users, 
  Car, 
  Utensils,
  FootprintsIcon,
  Sun,
  GamepadIcon,
  Coffee,
  Dice1,
  Library,
  GlassWater,
  Landmark,
  Gem,
  Map as MapIcon,
  Building,
  UtensilsCrossed,
  Frame as FrameIcon,
  Snowflake,
  Beer as BeerIcon,
  ShoppingBag,
  Mountain,
  Plus,
  Plane,
  Train,
  Bus,
  Bike,
  Tent,
  Hotel,
  Camera,
  Music,
  Palette,
  Wine,
  Waves,
  TreePine,
  Church,
  Castle,
  Ship,
  Fish,
  Flower2,
  Leaf,
  Umbrella,
  Shirt,
  Sparkles,
  Ticket,
  Drumstick,
  Cookie,
  Sandwich,
  Soup,
  Home as HomeIcon,
  MoonStar,
  HeartPulse,
  Music2
} from 'lucide-react';
import { TripInterestCategory, Currency } from '../subtrip-types';
import i18next from 'i18next';

// Helper function to get translations
const t = (key: string) => i18next.t(key, { ns: 'home' });

export const activities = [
  { id: 'plan-trip' as const, label: 'ZapTrip', icon: MapPin },
  { id: 'tinder-date' as const, label: 'ZapOut', icon: Heart },
  { id: 'friends' as const, label: 'ZapOut', icon: Users },
  { id: 'roadtrip' as const, label: 'ZapRoad', icon: Car }
];

export const tinderOptions = [
  { id: 'must-see', label: t('tinderOptions.mustSee'), icon: Landmark },
  { id: 'restaurant', label: t('tinderOptions.food'), icon: Utensils },
  { id: 'hidden-gems', label: t('tinderOptions.hiddenGems'), icon: Gem },
  { id: 'tours', label: t('tinderOptions.tours'), icon: MapIcon },
  { id: 'historic', label: t('tinderOptions.historic'), icon: Building },
  { id: 'photography-spots', label: t('tinderOptions.photographySpots'), icon: Camera },
  { id: 'art', label: t('tinderOptions.art'), icon: FrameIcon },
  { id: 'outdoor', label: t('tinderOptions.outdoor'), icon: Sun },
  { id: 'seasonal-activities', label: t('tinderOptions.seasonalActivities'), icon: Snowflake },
  { id: 'breweries', label: t('tinderOptions.breweries'), icon: BeerIcon },
  { id: 'shopping', label: t('tinderOptions.shopping'), icon: ShoppingBag },
  { id: 'adventure', label: t('tinderOptions.adventure'), icon: Mountain },
  { id: 'nightlife', label: t('tinderOptions.nightlife'), icon: MoonStar },
  { id: 'music', label: t('tinderOptions.music'), icon: Music2 },
  { id: 'wellness', label: t('tinderOptions.wellness'), icon: HeartPulse },
  { id: 'other', label: t('tinderOptions.other'), icon: Plus },
];

export const tripInterests: TripInterestCategory[] = [
  // Culture & Heritage
  { 
    category: 'culture',
    items: [
      { id: 'culture', label: 'culture', icon: Landmark },
      { id: 'museums', label: 'museums', icon: Building },
      { id: 'historical-sites', label: 'historicalSites', icon: Castle },
      { id: 'religious-sites', label: 'religiousSites', icon: Church },
      { id: 'local-traditions', label: 'localTraditions', icon: Sparkles },
    ]
  },

  // Food & Dining
  {
    category: 'food',
    items: [
      { id: 'food-drink', label: 'foodDrink', icon: UtensilsCrossed },
      { id: 'fine-dining', label: 'fineDining', icon: Utensils },
      { id: 'breweries', label: 'breweries', icon: BeerIcon },
      { id: 'street-food', label: 'streetFood', icon: Drumstick },
      { id: 'cafes', label: 'cafes', icon: Coffee },
      { id: 'wine-tasting', label: 'wineTasting', icon: Wine },
      { id: 'local-cuisine', label: 'localCuisine', icon: Soup },
      { id: 'food-tours', label: 'foodTours', icon: Cookie },
    ]
  },

  // Nature & Outdoors
  {
    category: 'nature',
    items: [
      { id: 'nature', label: 'nature', icon: Mountain },
      { id: 'hiking', label: 'hiking', icon: FootprintsIcon },
      { id: 'beaches', label: 'beaches', icon: Waves },
      { id: 'forests', label: 'forests', icon: TreePine },
      { id: 'gardens', label: 'gardens', icon: Flower2 },
      { id: 'wildlife', label: 'wildlife', icon: Fish },
      { id: 'eco-tourism', label: 'ecoTourism', icon: Leaf },
    ]
  },

  // Activities & Entertainment
  {
    category: 'activities',
    items: [
      { id: 'adventure', label: 'adventure', icon: Mountain },
      { id: 'water-sports', label: 'waterSports', icon: Ship },
      { id: 'cycling', label: 'cycling', icon: Bike },
      { id: 'nightlife', label: 'nightlife', icon: BeerIcon },
      { id: 'entertainment', label: 'entertainment', icon: Ticket },
      { id: 'festivals', label: 'festivals', icon: Music },
    ]
  },

  // Shopping & Markets
  {
    category: 'shopping',
    items: [
      { id: 'shopping', label: 'shopping', icon: ShoppingBag },
      { id: 'local-markets', label: 'localMarkets', icon: ShoppingBag },
      { id: 'fashion', label: 'fashion', icon: Shirt },
      { id: 'souvenirs', label: 'souvenirs', icon: Gem },
    ]
  },

  // Relaxation & Wellness
  {
    category: 'relaxation',
    items: [
      { id: 'relaxation', label: 'relaxation', icon: Umbrella },
      { id: 'beaches-relax', label: 'beachesRelax', icon: Sun },
      { id: 'thermal-springs', label: 'thermalSprings', icon: GlassWater },
    ]
  },

  // Arts & Photography
  {
    category: 'arts',
    items: [
      { id: 'arts', label: 'arts', icon: FrameIcon },
      { id: 'photography', label: 'photography', icon: Camera },
      { id: 'street-art', label: 'streetArt', icon: Palette },
    ]
  },

  // Local Experiences
  {
    category: 'localExperiences',
    items: [
      { id: 'local-exp', label: 'localExperiences', icon: Users },
      { id: 'cooking-classes', label: 'cookingClasses', icon: UtensilsCrossed },
      { id: 'workshops', label: 'localWorkshops', icon: Palette },
      { id: 'guided-tours', label: 'guidedTours', icon: MapIcon },
    ]
  },
];

export const transportOptions = [
  { id: 'plane', label: 'Plane', icon: Plane },
  { id: 'train', label: 'Train', icon: Train },
  { id: 'bus', label: 'Bus', icon: Bus },
  { id: 'car', label: 'Car', icon: Car }
];

export const accommodationOptions = [
  { id: 'hotel', label: 'Hotel', icon: Hotel, description: 'Traditional hotel accommodation' },
  { id: 'airbnb', label: 'Airbnb', icon: Building, description: 'Vacation rentals and homes' },
  { id: 'hostel', label: 'Youth Hostel', icon: Users, description: 'Budget-friendly shared accommodation' },
  { id: 'camping', label: 'Camping', icon: Tent, description: 'Outdoor camping experience' },
  { id: 'resort', label: 'Resort', icon: Umbrella, description: 'All-inclusive resort stays' },
  { id: 'bnb', label: 'Bed & Breakfast', icon: Coffee, description: 'Cozy B&B experience' },
];

export const currencies: Currency[] = [
  { value: "USD", label: "USD - US Dollar", symbol: "$" },
  { value: "EUR", label: "EUR - Euro", symbol: "€" },
  { value: "GBP", label: "GBP - British Pound", symbol: "£" },
  { value: "CAD", label: "CAD - Canadian Dollar", symbol: "$" },
  { value: "AUD", label: "AUD - Australian Dollar", symbol: "$" },
  { value: "JPY", label: "JPY - Japanese Yen", symbol: "¥" },
  { value: "CNY", label: "CNY - Chinese Yuan", symbol: "¥" },
  { value: "CHF", label: "CHF - Swiss Franc", symbol: "$" },
  { value: "INR", label: "INR - Indian Rupee", symbol: "₹" },
  { value: "BRL", label: "BRL - Brazilian Real", symbol: "$" },
];

// Road trip specific interest categories
export const roadTripInterestCategories: TripInterestCategory[] = [
  // Scenic & Nature
  {
    category: 'scenicNature',
    items: [
      { id: 'scenic-routes', label: 'scenic', icon: Mountain },
      { id: 'photo-spots', label: 'photo', icon: Camera },
      { id: 'landmarks', label: 'landmarks', icon: Landmark },
      { id: 'nature', label: 'nature', icon: TreePine },
      { id: 'beaches', label: 'beaches', icon: Waves },
    ]
  },
  // Places
  {
    category: 'places',
    items: [
      { id: 'small-towns', label: 'towns', icon: HomeIcon },
      { id: 'museums', label: 'museums', icon: Building },
      { id: 'parks', label: 'parks', icon: Leaf },
    ]
  },
  // Activities
  {
    category: 'activities',
    items: [
      { id: 'local-food', label: 'food', icon: UtensilsCrossed },
      { id: 'camping', label: 'camping', icon: Tent },
      { id: 'shopping', label: 'shopping', icon: ShoppingBag },
      { id: 'entertainment', label: 'entertainment', icon: Music },
    ]
  }
];

export { useTranslatedData as default } from './useTranslatedData'; 