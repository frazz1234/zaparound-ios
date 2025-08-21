import {
  MapPin,
  Heart,
  Users,
  Car,
  Utensils,
  FootprintsIcon,
  Sun,
  Coffee,
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
  Soup,
  Home as HomeIcon
} from 'lucide-react';
import i18next from 'i18next';

export const MAX_SELECTIONS = 3;

// Helper function to get translations
const t = (key: string) => i18next.t(key, { ns: 'home' });

// Activity types that don't need translation
export const activities = [
  { id: 'plan-trip' as const, label: 'Plan a Trip', icon: MapPin },
  { id: 'tinder-date' as const, label: 'Tinder Date', icon: Heart },
  { id: 'friends' as const, label: 'Friends', icon: Users },
  { id: 'roadtrip' as const, label: 'Road Trip', icon: Car }
];

export const currencies = [
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

export const tripInterests = [
  {
    category: 'Culture',
    items: [
      { id: 'culture', label: 'Culture', icon: Landmark },
      { id: 'museums', label: 'Museums', icon: Building },
      { id: 'historical-sites', label: 'Historical Sites', icon: Castle },
      { id: 'religious-sites', label: 'Religious Sites', icon: Church },
      { id: 'local-traditions', label: 'Local Traditions', icon: Sparkles },
    ]
  },
  {
    category: 'Food',
    items: [
      { id: 'food-drink', label: 'Food & Drink', icon: UtensilsCrossed },
      { id: 'fine-dining', label: 'Fine Dining', icon: Utensils },
      { id: 'breweries', label: 'Breweries', icon: BeerIcon },
      { id: 'street-food', label: 'Street Food', icon: Drumstick },
      { id: 'cafes', label: 'Cafes', icon: Coffee },
      { id: 'wine-tasting', label: 'Wine Tasting', icon: Wine },
      { id: 'local-cuisine', label: 'Local Cuisine', icon: Soup },
      { id: 'food-tours', label: 'Food Tours', icon: Cookie },
    ]
  }
];

export const tinderOptions = [
  { id: 'must-see', label: 'Must See', icon: Landmark },
  { id: 'restaurant', label: 'Food', icon: Utensils },
  { id: 'hidden-gems', label: 'Hidden Gems', icon: Gem },
  { id: 'tours', label: 'Tours', icon: MapIcon },
  { id: 'historic', label: 'Historic', icon: Building },
  { id: 'french-cuisine', label: 'French Cuisine', icon: UtensilsCrossed },
  { id: 'art', label: 'Art', icon: FrameIcon },
  { id: 'outdoor', label: 'Outdoor', icon: Sun },
  { id: 'seasonal-activities', label: 'Seasonal Activities', icon: Snowflake },
  { id: 'breweries', label: 'Breweries', icon: BeerIcon },
  { id: 'shopping', label: 'Shopping', icon: ShoppingBag },
  { id: 'adventure', label: 'Adventure', icon: Mountain },
  { id: 'other', label: 'Other', icon: Plus }
];

export const roadTripInterests = [
  { id: 'scenic-routes', label: 'Scenic Routes', icon: Mountain },
  { id: 'photo-spots', label: 'Photo Spots', icon: Camera },
  { id: 'local-food', label: 'Local Food', icon: UtensilsCrossed },
  { id: 'camping', label: 'Camping', icon: Tent },
  { id: 'landmarks', label: 'Landmarks', icon: Landmark },
  { id: 'nature', label: 'Nature', icon: TreePine },
  { id: 'beaches', label: 'Beaches', icon: Waves },
  { id: 'small-towns', label: 'Small Towns', icon: HomeIcon },
  { id: 'museums', label: 'Museums', icon: Building },
  { id: 'parks', label: 'Parks', icon: Leaf },
  { id: 'shopping', label: 'Shopping', icon: ShoppingBag },
  { id: 'entertainment', label: 'Entertainment', icon: Music },
  { id: 'other', label: 'Other', icon: Plus }
]; 