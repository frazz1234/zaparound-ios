import { OpenAI } from 'openai';
import { NextResponse } from 'next/server';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { location } = await req.json();

    const prompt = `Generate a short, engaging description for ${location} as a travel destination. Return the response in JSON format with the following fields:
    - name: The main city/location name
    - country: The country name
    - description: A 1-2 sentence engaging description of the location
    Keep the description under 100 characters.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
    });

    const response = completion.choices[0].message.content;
    const locationDetails = JSON.parse(response || '{}');

    return NextResponse.json(locationDetails);
  } catch (error) {
    console.error('Error in location-details API:', error);
    return NextResponse.json(
      { error: 'Failed to get location details' },
      { status: 500 }
    );
  }
} 