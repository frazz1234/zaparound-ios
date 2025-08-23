import { useTranslation } from 'react-i18next';
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
  HeartPulse,
  Music2,
  MoonStar
} from 'lucide-react';
import { TripInterestCategory, Currency } from '../subtrip-types';

export const useTranslatedData = () => {
  const { t } = useTranslation('home');

  const activities = [
    { id: 'plan-trip' as const, label: 'ZapTrip', icon: MapPin },
    { id: 'tinder-date' as const, label: 'ZapOut', icon: Heart },
    { id: 'friends' as const, label: 'ZapOut', icon: Users },
    { id: 'roadtrip' as const, label: 'ZapRoad', icon: Car }
  ];

  const tinderOptions = [
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

  const tripInterests: TripInterestCategory[] = [
    // Culture & Heritage
    { 
      category: 'culture',
      items: [
        { id: 'culture', label: t('tripInterests.culture'), icon: Landmark },
        { id: 'museums', label: t('tripInterests.museums'), icon: Building },
        { id: 'historical-sites', label: t('tripInterests.historicalSites'), icon: Castle },
        { id: 'religious-sites', label: t('tripInterests.religiousSites'), icon: Church },
        { id: 'local-traditions', label: t('tripInterests.localTraditions'), icon: Sparkles },
      ]
    },

    // Food & Dining
    {
      category: 'food',
      items: [
        { id: 'food-drink', label: t('tripInterests.foodDrink'), icon: UtensilsCrossed },
        { id: 'fine-dining', label: t('tripInterests.fineDining'), icon: Utensils },
        { id: 'breweries', label: t('tripInterests.breweries'), icon: BeerIcon },
        { id: 'street-food', label: t('tripInterests.streetFood'), icon: Drumstick },
        { id: 'cafes', label: t('tripInterests.cafes'), icon: Coffee },
        { id: 'wine-tasting', label: t('tripInterests.wineTasting'), icon: Wine },
        { id: 'local-cuisine', label: t('tripInterests.localCuisine'), icon: Soup },
        { id: 'food-tours', label: t('tripInterests.foodTours'), icon: Cookie },
      ]
    },

    // Nature & Outdoors
    {
      category: 'nature',
      items: [
        { id: 'nature', label: t('tripInterests.nature'), icon: Mountain },
        { id: 'hiking', label: t('tripInterests.hiking'), icon: FootprintsIcon },
        { id: 'beaches', label: t('tripInterests.beaches'), icon: Waves },
        { id: 'forests', label: t('tripInterests.forests'), icon: TreePine },
        { id: 'gardens', label: t('tripInterests.gardens'), icon: Flower2 },
        { id: 'wildlife', label: t('tripInterests.wildlife'), icon: Fish },
        { id: 'eco-tourism', label: t('tripInterests.ecoTourism'), icon: Leaf },
      ]
    },

    // Activities & Entertainment
    {
      category: 'activities',
      items: [
        { id: 'adventure', label: t('tripInterests.adventure'), icon: Mountain },
        { id: 'water-sports', label: t('tripInterests.waterSports'), icon: Ship },
        { id: 'cycling', label: t('tripInterests.cycling'), icon: Bike },
        { id: 'nightlife', label: t('tripInterests.nightlife'), icon: BeerIcon },
        { id: 'entertainment', label: t('tripInterests.entertainment'), icon: Ticket },
        { id: 'festivals', label: t('tripInterests.festivals'), icon: Music },
      ]
    },

    // Shopping & Markets
    {
      category: 'shopping',
      items: [
        { id: 'shopping', label: t('tripInterests.shopping'), icon: ShoppingBag },
        { id: 'local-markets', label: t('tripInterests.localMarkets'), icon: ShoppingBag },
        { id: 'fashion', label: t('tripInterests.fashion'), icon: Shirt },
        { id: 'souvenirs', label: t('tripInterests.souvenirs'), icon: Gem },
      ]
    },

    // Relaxation & Wellness
    {
      category: 'relaxation',
      items: [
        { id: 'relaxation', label: t('tripInterests.relaxation'), icon: Umbrella },
        { id: 'beaches-relax', label: t('tripInterests.beachesRelax'), icon: Sun },
        { id: 'thermal-springs', label: t('tripInterests.thermalSprings'), icon: GlassWater },
      ]
    },

    // Arts & Photography
    {
      category: 'arts',
      items: [
        { id: 'arts', label: t('tripInterests.arts'), icon: FrameIcon },
        { id: 'photography', label: t('tripInterests.photography'), icon: Camera },
        { id: 'street-art', label: t('tripInterests.streetArt'), icon: Palette },
      ]
    },

    // Local Experiences
    {
      category: 'localExperiences',
      items: [
        { id: 'local-experiences', label: t('tripInterests.localExperiences'), icon: Users },
        { id: 'cooking-classes', label: t('tripInterests.cookingClasses'), icon: UtensilsCrossed },
        { id: 'workshops', label: t('tripInterests.localWorkshops'), icon: Palette },
        { id: 'guided-tours', label: t('tripInterests.guidedTours'), icon: MapIcon },
      ]
    },
  ];

  const transportOptions = [
    { id: 'plane', label: t('transport.plane'), icon: Plane },
    { id: 'train', label: t('transport.train'), icon: Train },
    { id: 'bus', label: t('transport.bus'), icon: Bus },
    { id: 'car', label: t('transport.car'), icon: Car }
  ];

  const accommodationOptions = [
    { id: 'hotel', label: t('accommodation.hotel'), icon: Hotel, description: t('accommodation.hotelDesc') },
    { id: 'airbnb', label: t('accommodation.airbnb'), icon: Building, description: t('accommodation.airbnbDesc') },
    { id: 'hostel', label: t('accommodation.hostel'), icon: Users, description: t('accommodation.hostelDesc') },
    { id: 'camping', label: t('accommodation.camping'), icon: Tent, description: t('accommodation.campingDesc') },
    { id: 'resort', label: t('accommodation.resort'), icon: Umbrella, description: t('accommodation.resortDesc') },
    { id: 'bnb', label: t('accommodation.bnb'), icon: Coffee, description: t('accommodation.bnbDesc') },
  ];

  const currencies: Currency[] = [
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

  const roadTripInterestCategories: TripInterestCategory[] = [
    // Scenic & Nature
    {
      category: 'scenicNature',
      items: [
        { id: 'scenic-routes', label: t('roadTrip.interests.scenic'), icon: Mountain },
        { id: 'photo-spots', label: t('roadTrip.interests.photo'), icon: Camera },
        { id: 'landmarks', label: t('roadTrip.interests.landmarks'), icon: Landmark },
        { id: 'nature', label: t('roadTrip.interests.nature'), icon: TreePine },
        { id: 'beaches', label: t('roadTrip.interests.beaches'), icon: Waves },
      ]
    },
    // Places
    {
      category: 'places',
      items: [
        { id: 'small-towns', label: t('roadTrip.interests.towns'), icon: HomeIcon },
        { id: 'museums', label: t('roadTrip.interests.museums'), icon: Building },
        { id: 'parks', label: t('roadTrip.interests.parks'), icon: Leaf },
      ]
    },
    // Activities
    {
      category: 'activities',
      items: [
        { id: 'local-food', label: t('roadTrip.interests.food'), icon: UtensilsCrossed },
        { id: 'camping', label: t('roadTrip.interests.camping'), icon: Tent },
        { id: 'shopping', label: t('roadTrip.interests.shopping'), icon: ShoppingBag },
        { id: 'entertainment', label: t('roadTrip.interests.entertainment'), icon: Music },
      ]
    }
  ];

  return {
    activities,
    tinderOptions,
    tripInterests,
    transportOptions,
    accommodationOptions,
    currencies,
    roadTripInterestCategories
  };
}; 