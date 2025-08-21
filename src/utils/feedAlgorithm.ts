import { supabase } from '@/integrations/supabase/client';

export interface FeedPost {
  id: number;
  user_id: string;
  content: string;
  media_urls?: any[];
  image_url?: string;
  location?: string;
  place_id?: string;
  place_lat?: number;
  place_lng?: number;
  place_types?: string[];
  place_rating?: number;
  place_user_ratings_total?: number;
  post_type?: 'activity' | 'destination';
  rating?: number;
  created_at: string;
  updated_at: string;
  is_published: boolean;
  profile?: {
    username?: string;
    first_name?: string;
    last_name?: string;
    avatar_url?: string;
  };
  likes?: Array<{ count: number }>;
  replies?: Array<{ count: number }>;
  // Calculated scores
  distance?: number;
  popularity_score?: number;
  recency_score?: number;
  engagement_score?: number;
  final_score?: number;
}

export interface UserLocation {
  lat: number;
  lng: number;
}

// Configuration des poids pour l'algorithme
const WEIGHTS = {
  RECENCY: 0.3,        // 30% - Les posts récents sont plus importants
  PROXIMITY: 0.25,     // 25% - La proximité géographique
  POPULARITY: 0.25,    // 25% - Popularité basée sur likes/réponses
  ENGAGEMENT: 0.2      // 20% - Taux d'engagement (likes + réponses)
};

// Rayons de proximité en km
const PROXIMITY_RADIUS = [50, 100, 200, 500, 1000];

export class FeedAlgorithm {
  private userLocation: UserLocation | null = null;

  constructor(userLocation?: UserLocation) {
    this.userLocation = userLocation || null;
  }

  // Calcule la distance entre deux points (formule de Haversine)
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Rayon de la Terre en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  // Calcule le score de récence (0-1)
  private calculateRecencyScore(createdAt: string): number {
    const now = new Date();
    const postDate = new Date(createdAt);
    const hoursDiff = (now.getTime() - postDate.getTime()) / (1000 * 60 * 60);
    
    // Score décroît exponentiellement avec le temps
    // Posts de moins de 1h = score 1, posts de 24h = score ~0.37
    return Math.exp(-hoursDiff / 24);
  }

  // Calcule le score de proximité (0-1)
  private calculateProximityScore(distance: number): number {
    if (!this.userLocation || distance === undefined) return 0.5; // Score neutre si pas de localisation
    
    // Score basé sur les rayons de proximité
    if (distance <= 50) return 1.0;      // Très proche
    if (distance <= 100) return 0.9;     // Proche
    if (distance <= 200) return 0.8;     // Régional
    if (distance <= 500) return 0.6;     // National
    if (distance <= 1000) return 0.4;    // Continental
    return 0.3;                          // Around the World (augmenté pour encourager la découverte)
  }

  // Vérifie si un post est "Around the World" (>1000km)
  private isAroundTheWorld(distance: number): boolean {
    return distance > 1000;
  }

  // Calcule le score de popularité (0-1)
  private calculatePopularityScore(likes: number, replies: number): number {
    const totalEngagement = likes + replies;
    
    // Score logarithmique pour éviter que les posts très populaires dominent
    return Math.min(1, Math.log10(totalEngagement + 1) / 3);
  }

  // Calcule le score d'engagement (0-1)
  private calculateEngagementScore(likes: number, replies: number): number {
    const totalEngagement = likes + replies;
    const engagementRate = totalEngagement / 10; // Normalisé sur 10 interactions
    
    return Math.min(1, engagementRate);
  }

  // Calcule le score final pour un post
  private calculateFinalScore(post: FeedPost): number {
    const recencyScore = this.calculateRecencyScore(post.created_at);
    const proximityScore = this.calculateProximityScore(post.distance || 0);
    const popularityScore = this.calculatePopularityScore(
      post.likes?.[0]?.count || 0,
      post.replies?.[0]?.count || 0
    );
    const engagementScore = this.calculateEngagementScore(
      post.likes?.[0]?.count || 0,
      post.replies?.[0]?.count || 0
    );

    // Calcul du score final pondéré
    const finalScore = 
      recencyScore * WEIGHTS.RECENCY +
      proximityScore * WEIGHTS.PROXIMITY +
      popularityScore * WEIGHTS.POPULARITY +
      engagementScore * WEIGHTS.ENGAGEMENT;

    return finalScore;
  }

  // Récupère et trie les posts selon l'algorithme
  async getFeedPosts(page: number = 1, limit: number = 15): Promise<FeedPost[]> {
    try {
      // 1. Récupérer tous les posts avec leurs métadonnées
      let query = supabase
        .from('community_posts')
        .select(`
          *,
          likes:post_likes(count),
          replies:post_replies(count),
          profile:profiles!user_id (
            username,
            first_name,
            last_name,
            avatar_url
          )
        `)
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      const { data: posts, error } = await query;

      if (error) throw error;

      // 2. Calculer les distances et scores pour chaque post
      const postsWithScores: FeedPost[] = posts.map(post => {
        let distance = undefined;
        
        // Calculer la distance si on a la localisation de l'utilisateur
        if (this.userLocation && post.place_lat && post.place_lng) {
          distance = this.calculateDistance(
            this.userLocation.lat,
            this.userLocation.lng,
            post.place_lat,
            post.place_lng
          );
        }

        const postWithScores: FeedPost = {
          ...post,
          distance,
          recency_score: this.calculateRecencyScore(post.created_at),
          popularity_score: this.calculatePopularityScore(
            post.likes?.[0]?.count || 0,
            post.replies?.[0]?.count || 0
          ),
          engagement_score: this.calculateEngagementScore(
            post.likes?.[0]?.count || 0,
            post.replies?.[0]?.count || 0
          )
        };

        postWithScores.final_score = this.calculateFinalScore(postWithScores);
        
        return postWithScores;
      });

      // 3. Trier par score final décroissant
      postsWithScores.sort((a, b) => (b.final_score || 0) - (a.final_score || 0));

      // 4. Appliquer la pagination
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      
      return postsWithScores.slice(startIndex, endIndex);

    } catch (error) {
      console.error('Error fetching feed posts:', error);
      return [];
    }
  }

  // Récupère les posts populaires (posts avec beaucoup d'engagement)
  async getPopularPosts(limit: number = 10): Promise<FeedPost[]> {
    try {
      const { data: posts, error } = await supabase
        .from('community_posts')
        .select(`
          *,
          likes:post_likes(count),
          replies:post_replies(count),
          profile:profiles!user_id (
            username,
            first_name,
            last_name,
            avatar_url
          )
        `)
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(limit * 2); // Récupérer plus pour filtrer

      if (error) throw error;

      // Calculer les scores et trier par popularité
      const postsWithScores = posts.map(post => ({
        ...post,
        popularity_score: this.calculatePopularityScore(
          post.likes?.[0]?.count || 0,
          post.replies?.[0]?.count || 0
        )
      }));

      postsWithScores.sort((a, b) => (b.popularity_score || 0) - (a.popularity_score || 0));
      
      return postsWithScores.slice(0, limit);

    } catch (error) {
      console.error('Error fetching popular posts:', error);
      return [];
    }
  }

  // Récupère les posts récents (posts des dernières 24h)
  async getRecentPosts(limit: number = 10): Promise<FeedPost[]> {
    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const { data: posts, error } = await supabase
        .from('community_posts')
        .select(`
          *,
          likes:post_likes(count),
          replies:post_replies(count),
          profile:profiles!user_id (
            username,
            first_name,
            last_name,
            avatar_url
          )
        `)
        .eq('is_published', true)
        .gte('created_at', yesterday.toISOString())
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return posts;

    } catch (error) {
      console.error('Error fetching recent posts:', error);
      return [];
    }
  }

  // Récupère les destinations populaires et récentes (optimisé pour les destinations)
  async getDestinationPosts(page: number = 1, limit: number = 15): Promise<FeedPost[]> {
    try {
      // Récupérer plus de posts pour avoir un bon échantillon
      const { data: posts, error } = await supabase
        .from('community_posts')
        .select(`
          *,
          likes:post_likes(count),
          replies:post_replies(count),
          profile:profiles!user_id (
            username,
            first_name,
            last_name,
            avatar_url
          )
        `)
        .eq('is_published', true)
        .eq('post_type', 'destination')
        .order('created_at', { ascending: false })
        .limit(limit * 3); // Récupérer plus pour avoir un bon tri

      if (error) throw error;

      // Calculer les scores pour chaque destination
      const postsWithScores: FeedPost[] = posts.map(post => {
        let distance = undefined;
        
        if (this.userLocation && post.place_lat && post.place_lng) {
          distance = this.calculateDistance(
            this.userLocation.lat,
            this.userLocation.lng,
            post.place_lat,
            post.place_lng
          );
        }

        const popularityScore = this.calculatePopularityScore(
          post.likes?.[0]?.count || 0,
          post.replies?.[0]?.count || 0
        );
        const recencyScore = this.calculateRecencyScore(post.created_at);
        const proximityScore = this.calculateProximityScore(distance || 0);

        // Score spécial pour les destinations: plus de poids sur popularité et récence
        const destinationScore = 
          (popularityScore * 0.4) +      // 40% popularité
          (recencyScore * 0.35) +        // 35% récence
          (proximityScore * 0.25);       // 25% proximité

        return {
          ...post,
          distance,
          popularity_score: popularityScore,
          recency_score: recencyScore,
          engagement_score: this.calculateEngagementScore(
            post.likes?.[0]?.count || 0,
            post.replies?.[0]?.count || 0
          ),
          final_score: destinationScore
        };
      });

      // Trier par score de destination
      postsWithScores.sort((a, b) => (b.final_score || 0) - (a.final_score || 0));

      // Appliquer la pagination
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      
      return postsWithScores.slice(startIndex, endIndex);

    } catch (error) {
      console.error('Error fetching destination posts:', error);
      return [];
    }
  }

  // Récupère les posts "Around the World" (>1000km)
  async getAroundTheWorldPosts(page: number = 1, limit: number = 15): Promise<FeedPost[]> {
    try {
      const { data: posts, error } = await supabase
        .from('community_posts')
        .select(`
          *,
          likes:post_likes(count),
          replies:post_replies(count),
          profile:profiles!user_id (
            username,
            first_name,
            last_name,
            avatar_url
          )
        `)
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(limit * 2);

      if (error) throw error;

      // Filtrer et calculer les scores pour les posts >1000km
      const aroundTheWorldPosts: FeedPost[] = posts
        .map(post => {
          let distance = undefined;
          
          if (this.userLocation && post.place_lat && post.place_lng) {
            distance = this.calculateDistance(
              this.userLocation.lat,
              this.userLocation.lng,
              post.place_lat,
              post.place_lng
            );
          }

          return {
            ...post,
            distance,
            popularity_score: this.calculatePopularityScore(
              post.likes?.[0]?.count || 0,
              post.replies?.[0]?.count || 0
            ),
            recency_score: this.calculateRecencyScore(post.created_at),
            engagement_score: this.calculateEngagementScore(
              post.likes?.[0]?.count || 0,
              post.replies?.[0]?.count || 0
            )
          };
        })
        .filter(post => post.distance && post.distance > 1000)
        .map(post => ({
          ...post,
          final_score: this.calculateFinalScore(post)
        }));

      // Trier par score final
      aroundTheWorldPosts.sort((a, b) => (b.final_score || 0) - (a.final_score || 0));

      // Appliquer la pagination
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      
      return aroundTheWorldPosts.slice(startIndex, endIndex);

    } catch (error) {
      console.error('Error fetching around the world posts:', error);
      return [];
    }
  }

  // Met à jour la localisation de l'utilisateur
  updateUserLocation(location: UserLocation) {
    this.userLocation = location;
  }
}

// Fonction utilitaire pour obtenir les posts du feed
export const getFeedPosts = async (
  userLocation?: UserLocation,
  page: number = 1,
  limit: number = 15
): Promise<FeedPost[]> => {
  const algorithm = new FeedAlgorithm(userLocation);
  return algorithm.getFeedPosts(page, limit);
};

// Fonction utilitaire pour obtenir les posts populaires
export const getPopularPosts = async (
  limit: number = 10
): Promise<FeedPost[]> => {
  const algorithm = new FeedAlgorithm();
  return algorithm.getPopularPosts(limit);
};

// Fonction utilitaire pour obtenir les posts récents
export const getRecentPosts = async (
  limit: number = 10
): Promise<FeedPost[]> => {
  const algorithm = new FeedAlgorithm();
  return algorithm.getRecentPosts(limit);
};

// Fonction utilitaire pour obtenir les destinations optimisées
export const getDestinationPosts = async (
  userLocation?: UserLocation,
  page: number = 1,
  limit: number = 15
): Promise<FeedPost[]> => {
  const algorithm = new FeedAlgorithm(userLocation);
  return algorithm.getDestinationPosts(page, limit);
};

// Fonction utilitaire pour obtenir les posts "Around the World"
export const getAroundTheWorldPosts = async (
  userLocation?: UserLocation,
  page: number = 1,
  limit: number = 15
): Promise<FeedPost[]> => {
  const algorithm = new FeedAlgorithm(userLocation);
  return algorithm.getAroundTheWorldPosts(page, limit);
}; 