import { createApi } from 'unsplash-js';
import { NextResponse } from 'next/server';

const unsplash = createApi({
  accessKey: process.env.UNSPLASH_ACCESS_KEY || '',
});

export async function POST(req: Request) {
  try {
    const { query } = await req.json();

    const result = await unsplash.search.getPhotos({
      query: `${query} landmark travel destination`,
      orientation: 'landscape',
      perPage: 1,
    });

    if (result.errors) {
      throw new Error('Failed to fetch Unsplash image');
    }

    const photo = result.response?.results[0];
    
    if (!photo) {
      throw new Error('No image found');
    }

    return NextResponse.json({
      url: photo.urls.regular,
      credit: {
        name: photo.user.name,
        link: photo.user.links.html,
      },
    });
  } catch (error) {
    console.error('Error in unsplash-image API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch image' },
      { status: 500 }
    );
  }
} 