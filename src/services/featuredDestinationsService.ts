import { supabase } from '@/integrations/supabase/client';

export interface FeaturedDestinationDTO {
  id: string;
  slug: string;
  city: string;
  country: string;
  image_url: string | null;
  fallback_image_url: string | null;
  rating: number;
  review_count: number;
  price_min_cents: number;
  currency: string;
  sort_order: number;
  translation_name: string;
  translation_badge: string | null;
  translation_price_label: string | null;
}

export async function fetchFeaturedDestinations(locale: string): Promise<FeaturedDestinationDTO[]> {
  // Join base table with translations for the requested locale
  const { data, error } = await supabase
    .from('featured_destinations')
    .select(`
      id, slug, city, country, image_url, fallback_image_url, rating, review_count, price_min_cents, currency, sort_order,
      featured_destination_translations:featured_destination_translations!inner (
        locale, name, badge, price_label
      )
    `)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) throw error;

  const results: FeaturedDestinationDTO[] = (data as any[])
    .map((row) => {
      const tr = Array.isArray(row.featured_destination_translations)
        ? row.featured_destination_translations.find((r: any) => r.locale === locale) || row.featured_destination_translations[0]
        : null;
      return {
        id: row.id,
        slug: row.slug,
        city: row.city,
        country: row.country,
        image_url: row.image_url,
        fallback_image_url: row.fallback_image_url,
        rating: row.rating,
        review_count: row.review_count,
        price_min_cents: row.price_min_cents,
        currency: row.currency,
        sort_order: row.sort_order,
        translation_name: tr?.name || `${row.city}, ${row.country}`,
        translation_badge: tr?.badge || row.badge_key || null,
        translation_price_label: tr?.price_label || null,
      };
    });
  return results;
}

