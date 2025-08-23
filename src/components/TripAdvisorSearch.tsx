import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

// Initialize Supabase client with public anon key
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

type TripLocation = {
  location_id: string
  name: string
  description?: string
  web_url?: string
  address_obj?: {
    street1?: string
    city?: string
    country?: string
    postalcode?: string
  }
  photo?: {
    images?: {
      large?: {
        url?: string
      }
    }
  }
  rating?: string
  num_reviews?: string
  category?: {
    name?: string
  }
}

export default function TripAdvisorSearch() {
  const [searchQuery, setSearchQuery] = useState('')
  const [category, setCategory] = useState('attractions')
  const [results, setResults] = useState<TripLocation[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSearch = async () => {
    if (!searchQuery) return
    
    setLoading(true)
    setError(null)
    
    try {
      const { data, error } = await supabase.functions.invoke('trip-advisor', {
        body: {
          action: 'searchLocations',
          params: {
            searchQuery,
            category,
            limit: 10
          }
        }
      })
      
      if (error) throw error
      
      setResults(data?.data || [])
    } catch (e) {
      console.error('Error searching Trip Advisor:', e)
      setError('Failed to search Trip Advisor. Please try again later.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Trip Advisor Search</h1>
      
      <div className="flex gap-2 mb-6">
        <Input
          type="text"
          placeholder="Search for destinations, attractions, restaurants..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1"
        />
        
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="attractions">Attractions</SelectItem>
            <SelectItem value="restaurants">Restaurants</SelectItem>
            <SelectItem value="hotels">Hotels</SelectItem>
          </SelectContent>
        </Select>
        
        <Button onClick={handleSearch} disabled={loading}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Search
        </Button>
      </div>
      
      {error && (
        <div className="text-red-500 mb-4">{error}</div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {results.map((location) => (
          <Card key={location.location_id}>
            <CardHeader>
              <CardTitle>{location.name}</CardTitle>
              <CardDescription>
                {location.category?.name || category}
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              {location.photo?.images?.large?.url && (
                <img 
                  src={location.photo.images.large.url} 
                  alt={location.name}
                  className="w-full h-48 object-cover rounded-md mb-4" 
                />
              )}
              
              <p className="text-sm text-gray-600 mb-2">
                {location.address_obj?.street1} {location.address_obj?.city}, {location.address_obj?.country}
              </p>
              
              {location.description && (
                <p className="text-sm mb-4">{location.description}</p>
              )}
              
              {location.rating && (
                <div className="flex items-center gap-2">
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                    {location.rating}/5
                  </span>
                  <span className="text-xs text-gray-500">
                    {location.num_reviews || 0} reviews
                  </span>
                </div>
              )}
            </CardContent>
            
            <CardFooter>
              {location.web_url && (
                <Button variant="outline" size="sm" asChild>
                  <a href={location.web_url} target="_blank" rel="noopener noreferrer">
                    View on Trip Advisor
                  </a>
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>
      
      {results.length === 0 && !loading && searchQuery && (
        <div className="text-center my-12 text-gray-500">
          No results found. Try a different search term or category.
        </div>
      )}
    </div>
  )
} 