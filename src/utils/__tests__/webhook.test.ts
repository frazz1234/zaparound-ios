import { prepareTripWebhookPayload, prepareZapOutWebhookPayload, prepareZapRoadWebhookPayload } from '../webhook';

describe('webhook payload builders', () => {
  it('builds standard trip payload with parsed details', () => {
    const input = {
      id: 't1',
      title: 'Trip',
      description: 'Desc',
      location: 'Paris',
      budget: '123.45',
      transportation_details: JSON.stringify({ mode: 'plane', details: 'AF' }),
      accommodation_details: { type: 'hotel', details: '3 nights' },
      coordinates: JSON.stringify({ lat: 1, lng: 2 }),
      departure_coordinates: { lat: 3, lng: 4 },
      profile_data: { name: 'A' },
      email: 'u@example.com',
      interests: ['food'],
      has_pets: true,
    };
    const out = prepareTripWebhookPayload(input);
    expect(out.transportation_mode).toBe('plane');
    expect(out.accommodation_type).toBe('hotel');
    expect(out.coordinates).toEqual({ lat: 1, lng: 2 });
    expect(out.departure_coordinates).toEqual({ lat: 3, lng: 4 });
    expect(out.user_email).toBe('u@example.com');
    expect(out.profile.email).toBe('u@example.com');
    expect(out.budget).toBeCloseTo(123.45, 2);
  });

  it('builds zapout payload with formatted date and arrays', () => {
    const input = {
      id: 'z1',
      title: 'ZapOut',
      location: 'NYC',
      date: '2024-01-01',
      activity_times: ['morning'],
      requested_activities: ['museum'],
      activity_types: ['art'],
      coordinates: { lat: 5, lng: 6 },
      profile_data: {},
    };
    const out = prepareZapOutWebhookPayload(input);
    expect(out.date).toMatch(/T00:00:00/);
    expect(out.activity_times).toEqual(['morning']);
  });

  it('builds zaproad payload with stopover cities string', () => {
    const input = {
      id: 'zr1',
      stopover_cities: JSON.stringify([{ name: 'Quebec' }, { name: 'Boston' }]),
      profile_data: {},
    };
    const out = prepareZapRoadWebhookPayload(input as any);
    expect(out.stopover_cities).toContain('Quebec');
    expect(out.stopover_cities).toContain('Boston');
  });
});


