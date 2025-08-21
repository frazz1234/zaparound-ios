import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BookingEmailRequest {
  bookingReference: string;
  recipientEmail: string;
  bookingData: any;
  language?: string;
}

// Simple translation mapping for email content
const translations = {
  en: {
    zapbookingReference: "ZapBooking Reference:",
    bookingReferences: "Booking References",
    flightBookingDetails: "Flight Booking Details",
    thankYou: "Thank you for choosing ZapAround!",
    contactSupport: "If you have any questions, please contact our support team."
  },
  fr: {
    zapbookingReference: "Référence ZapBooking :",
    bookingReferences: "Références de Réservation",
    flightBookingDetails: "Détails de Réservation de Vol",
    thankYou: "Merci d'avoir choisi ZapAround !",
    contactSupport: "Si vous avez des questions, veuillez contacter notre équipe de support."
  },
  es: {
    zapbookingReference: "Referencia ZapBooking:",
    bookingReferences: "Referencias de Reserva",
    flightBookingDetails: "Detalles de Reserva de Vuelo",
    thankYou: "¡Gracias por elegir ZapAround!",
    contactSupport: "Si tienes alguna pregunta, por favor contacta a nuestro equipo de soporte."
  }
};

serve(async (req: Request) => {
  console.log("Booking email request received");
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    console.log("Handling CORS preflight request");
    return new Response(null, { headers: corsHeaders });
  }

  const resendKey = Deno.env.get("RESEND_API_KEY");
  if (!resendKey) {
    console.error("Missing RESEND_API_KEY environment variable");
    return new Response(
      JSON.stringify({ error: "Server configuration error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }

  try {
    const resend = new Resend(resendKey);

    // Parse the request body
    const requestData = await req.json();
    const { bookingReference, recipientEmail, bookingData, language = 'en' } = requestData as BookingEmailRequest;
    
    // Get translations for the specified language
    const t = translations[language as keyof typeof translations] || translations.en;

    console.log("Processing booking email request:", { bookingReference, recipientEmail });

    if (!bookingReference || !recipientEmail || !bookingData) {
      console.error("Missing required fields in booking email request");
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Format flight details
    const formatTime = (dateString: string) => {
      try {
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false 
        });
      } catch (error) {
        return 'N/A';
      }
    };

    const formatDate = (dateString: string) => {
      try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
          weekday: 'long',
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
      } catch (error) {
        return 'N/A';
      }
    };

    // Generate flight details HTML
    let flightDetailsHtml = '';
    if (bookingData.flight_data?.slices) {
      bookingData.flight_data.slices.forEach((slice: any, index: number) => {
        const segment = slice.segments[0];
        flightDetailsHtml += `
          <div class="flight-segment">
            <div class="flight-header">
              <h3>Flight ${index + 1}</h3>
              <div class="route">
                <strong>${slice.origin?.iata_code} → ${slice.destination?.iata_code}</strong>
              </div>
              <div class="date">${formatDate(segment?.departing_at)}</div>
            </div>
            <div class="flight-details">
              <div class="departure">
                <div class="time">${formatTime(segment?.departing_at)}</div>
                <div class="airport">${slice.origin?.name}</div>
                ${segment?.origin_terminal ? `<div class="terminal">Terminal ${segment.origin_terminal}</div>` : ''}
              </div>
              <div class="flight-info">
                <div class="airline">${segment?.marketing_carrier?.name}</div>
                <div class="flight-number">Flight ${segment?.marketing_carrier?.iata_code}</div>
              </div>
              <div class="arrival">
                <div class="time">${formatTime(segment?.arriving_at)}</div>
                <div class="airport">${slice.destination?.name}</div>
                ${segment?.destination_terminal ? `<div class="terminal">Terminal ${segment.destination_terminal}</div>` : ''}
              </div>
            </div>
          </div>
        `;
      });
    }

    // Generate passengers HTML
    let passengersHtml = '';
    if (bookingData.passengers) {
      bookingData.passengers.forEach((passenger: any, index: number) => {
        passengersHtml += `
          <div class="passenger">
            <div class="passenger-name">
              <strong>${passenger.title} ${passenger.given_name} ${passenger.family_name}</strong>
            </div>
            <div class="passenger-details">
              <div>Email: ${passenger.email}</div>
              <div>Phone: ${passenger.phone_number}</div>
              <div>Gender: ${passenger.gender === 'm' ? 'Male' : 'Female'}</div>
              <div>Date of Birth: ${formatDate(passenger.born_on)}</div>
            </div>
          </div>
        `;
      });
    }

    // Generate calendar events for each flight
    const generateCalendarEvents = () => {
      const events = [];
      
      if (bookingData.flight_data?.slices) {
        bookingData.flight_data.slices.forEach((slice: any, index: number) => {
          const segment = slice.segments[0];
          if (segment?.departing_at && segment?.arriving_at) {
            const departureDate = new Date(segment.departing_at);
            const arrivalDate = new Date(segment.arriving_at);
            
            // Create calendar event
            const event = {
              uid: `${bookingReference}-flight-${index + 1}`,
              summary: `Flight ${slice.origin?.iata_code} → ${slice.destination?.iata_code}`,
              description: `Flight ${segment?.marketing_carrier?.iata_code} with ${segment?.marketing_carrier?.name}
Booking Reference: ${bookingReference}
${segment?.origin_terminal ? `Departure Terminal: ${segment.origin_terminal}` : ''}
${segment?.destination_terminal ? `Arrival Terminal: ${segment.destination_terminal}` : ''}

Booked with ZapAround`,
              location: `${slice.origin?.name} → ${slice.destination?.name}`,
              start: departureDate,
              end: arrivalDate,
              allDay: false
            };
            
            events.push(event);
          }
        });
      }
      
      return events;
    };

    // Generate iCalendar content
    const generateICSContent = (events: any[]) => {
      let ics = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//ZapAround//Flight Booking//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
`;

      events.forEach(event => {
        const startDate = event.start.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        const endDate = event.end.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        
        ics += `BEGIN:VEVENT
UID:${event.uid}
DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z
DTSTART:${startDate}
DTEND:${endDate}
SUMMARY:${event.summary}
DESCRIPTION:${event.description.replace(/\n/g, '\\n')}
LOCATION:${event.location}
STATUS:CONFIRMED
SEQUENCE:0
END:VEVENT
`;
      });

      ics += `END:VCALENDAR`;
      return ics;
    };

    // Generate calendar links
    const generateCalendarLinks = (events: any[]) => {
      let calendarLinksHtml = '';
      
      events.forEach((event, index) => {
        const startDate = event.start.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        const endDate = event.end.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        
        // Google Calendar link
        const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.summary)}&dates=${startDate}/${endDate}&details=${encodeURIComponent(event.description)}&location=${encodeURIComponent(event.location)}`;
        
        // Outlook/Office 365 link
        const outlookUrl = `https://outlook.office.com/calendar/0/deeplink/compose?subject=${encodeURIComponent(event.summary)}&startdt=${event.start.toISOString()}&enddt=${event.end.toISOString()}&body=${encodeURIComponent(event.description)}&location=${encodeURIComponent(event.location)}`;
        
        // Apple Calendar (webcal)
        const appleUrl = `data:text/calendar;charset=utf8,${encodeURIComponent(generateICSContent([event]))}`;
        
        calendarLinksHtml += `
          <div class="calendar-event">
            <h4>Flight ${index + 1}: ${event.summary}</h4>
            <div class="calendar-buttons">
              <a href="${googleUrl}" target="_blank" class="calendar-btn google">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
                Add to Google Calendar
              </a>
              <a href="${outlookUrl}" target="_blank" class="calendar-btn outlook">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
                Add to Outlook
              </a>
              <a href="${appleUrl}" download="flight-${index + 1}.ics" class="calendar-btn apple">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
                Download for Apple Calendar
              </a>
            </div>
          </div>
        `;
      });
      
      return calendarLinksHtml;
    };

    const calendarEvents = generateCalendarEvents();
    const calendarLinksHtml = generateCalendarLinks(calendarEvents);

    // Create a modern, responsive email template
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Your Flight Booking Details</title>
          <style>
            :root {
              color-scheme: light;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #030303;
              background-color: #fcfcfc;
              margin: 0;
              padding: 0;
            }
            .wrapper {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .container {
              background-color: #ffffff;
              border-radius: 12px;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
              overflow: hidden;
            }
            .header {
              background-color: #61936f;
              color: #ffffff;
              padding: 30px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 24px;
              font-weight: 600;
            }
            .content {
              padding: 30px;
            }
            .booking-info {
              background-color: #fcfcfc;
              border-radius: 8px;
              padding: 20px;
              margin-bottom: 30px;
            }
            .booking-reference {
              font-size: 18px;
              font-weight: 600;
              color: #61936f;
              margin-bottom: 10px;
            }
            .booking-date {
              color: #62626a;
              font-size: 14px;
            }
            .section {
              margin-bottom: 30px;
            }
            .section-title {
              font-size: 18px;
              font-weight: 600;
              color: #1d1d1e;
              margin-bottom: 15px;
              border-bottom: 2px solid #61936f;
              padding-bottom: 5px;
            }
            .flight-segment {
              background-color: #fcfcfc;
              border-radius: 8px;
              padding: 20px;
              margin-bottom: 20px;
            }
            .flight-header {
              text-align: center;
              margin-bottom: 15px;
            }
            .flight-header h3 {
              margin: 0 0 10px 0;
              color: #61936f;
            }
            .route {
              font-size: 16px;
              margin-bottom: 5px;
            }
            .date {
              color: #62626a;
              font-size: 14px;
            }
            .flight-details {
              display: flex;
              justify-content: space-between;
              align-items: center;
              text-align: center;
            }
            .departure, .arrival {
              flex: 1;
            }
            .time {
              font-size: 20px;
              font-weight: 600;
              color: #1d1d1e;
            }
            .airport {
              font-size: 14px;
              color: #62626a;
              margin-top: 5px;
            }
            .terminal {
              font-size: 12px;
              color: #62626a;
              margin-top: 2px;
            }
            .flight-info {
              flex: 1;
              text-align: center;
            }
            .airline {
              font-weight: 600;
              color: #1d1d1e;
            }
            .flight-number {
              font-size: 14px;
              color: #62626a;
              margin-top: 2px;
            }
            .passenger {
              background-color: #fcfcfc;
              border-radius: 8px;
              padding: 15px;
              margin-bottom: 10px;
            }
            .passenger-name {
              margin-bottom: 8px;
            }
            .passenger-details {
              font-size: 14px;
              color: #62626a;
            }
            .passenger-details div {
              margin-bottom: 2px;
            }
            .financial-details {
              background-color: #fcfcfc;
              border-radius: 8px;
              padding: 20px;
            }
            .financial-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 10px;
            }
            .financial-row:last-child {
              border-top: 1px solid #e0e0e0;
              padding-top: 10px;
              margin-top: 15px;
              font-weight: 600;
              font-size: 16px;
            }
            .calendar-section {
              background-color: #f8f9fa;
              border-radius: 8px;
              padding: 20px;
              margin-bottom: 30px;
            }
            .calendar-event {
              margin-bottom: 20px;
            }
            .calendar-event h4 {
              margin: 0 0 10px 0;
              color: #1d1d1e;
              font-size: 16px;
            }
            .calendar-buttons {
              display: flex;
              flex-wrap: wrap;
              gap: 10px;
            }
            .calendar-btn {
              display: inline-flex;
              align-items: center;
              gap: 8px;
              padding: 10px 16px;
              border-radius: 6px;
              text-decoration: none;
              font-size: 14px;
              font-weight: 500;
              transition: all 0.2s;
              border: 1px solid;
            }
            .calendar-btn.google {
              background-color: #4285f4;
              color: white;
              border-color: #4285f4;
            }
            .calendar-btn.google:hover {
              background-color: #3367d6;
            }
            .calendar-btn.outlook {
              background-color: #0078d4;
              color: white;
              border-color: #0078d4;
            }
            .calendar-btn.outlook:hover {
              background-color: #106ebe;
            }
            .calendar-btn.apple {
              background-color: #000000;
              color: white;
              border-color: #000000;
            }
            .calendar-btn.apple:hover {
              background-color: #333333;
            }
            .footer {
              text-align: center;
              padding: 20px;
              color: #62626a;
              font-size: 14px;
              border-top: 1px solid #f0f0f0;
            }
            @media (max-width: 600px) {
              .wrapper {
                padding: 10px;
              }
              .header, .content {
                padding: 20px;
              }
              .flight-details {
                flex-direction: column;
                gap: 15px;
              }
              .financial-row {
                flex-direction: column;
                gap: 5px;
              }
              .calendar-buttons {
                flex-direction: column;
              }
              .calendar-btn {
                justify-content: center;
              }
            }
          </style>
        </head>
        <body>
          <div class="wrapper">
            <div class="container">
              <div class="header">
                <h1>Your Flight Booking Details</h1>
              </div>
              <div class="content">
                <div class="booking-info">
                  <div class="booking-reference">Booking Reference: ${bookingReference}</div>
                  <div class="booking-date">Booked on ${formatDate(bookingData.created_at)}</div>
                </div>

                ${calendarEvents.length > 0 ? `
                <div class="section">
                  <div class="section-title">📅 Add to Calendar</div>
                  <div class="calendar-section">
                    <p style="margin-bottom: 15px; color: #62626a;">Add your flights to your calendar to stay organized:</p>
                    ${calendarLinksHtml}
                  </div>
                </div>
                ` : ''}

                <div class="section">
                  <div class="section-title">Flight Details</div>
                  ${flightDetailsHtml}
                </div>

                <div class="section">
                  <div class="section-title">Passenger Information</div>
                  ${passengersHtml}
                </div>

                <div class="section">
                  <div class="section-title">Financial Summary</div>
                  <div class="financial-details">
                    <div class="financial-row">
                      <span>Base Amount:</span>
                      <span>${(bookingData.base_amount + bookingData.commission_amount).toFixed(2)} ${bookingData.currency}</span>
                    </div>
                    ${bookingData.luggage_fees > 0 ? `
                    <div class="financial-row">
                      <span>Luggage Fees:</span>
                      <span>${bookingData.luggage_fees} ${bookingData.currency}</span>
                    </div>
                    ` : ''}
                    ${bookingData.ancillaries_fees > 0 ? `
                    <div class="financial-row">
                      <span>Ancillaries Fees:</span>
                      <span>${bookingData.ancillaries_fees} ${bookingData.currency}</span>
                    </div>
                    ` : ''}
                    <div class="financial-row">
                      <span>Total Amount:</span>
                      <span>${bookingData.total_amount} ${bookingData.currency}</span>
                    </div>
                  </div>
                </div>

                ${bookingData.duffel_booking_reference ? `
                <div class="section">
                  <div class="section-title">${t.bookingReferences}</div>
                  <div class="financial-details">
                    <div class="financial-row">
                      <span>${t.zapbookingReference}</span>
                      <span>${bookingData.duffel_booking_reference}</span>
                    </div>
                  </div>
                </div>
                ` : ''}
              </div>
              <div class="footer">
                <p>${t.thankYou}</p>
                <p>${t.contactSupport}</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    // Generate iCalendar file for attachment
    const icsContent = generateICSContent(calendarEvents);

    // Generate subject with from/to locations and ZapBooking reference
    let subject = t.flightBookingDetails;
    if (bookingData.flight_data?.slices && bookingData.flight_data.slices.length > 0) {
      const firstSlice = bookingData.flight_data.slices[0];
      const lastSlice = bookingData.flight_data.slices[bookingData.flight_data.slices.length - 1];
      const fromLocation = firstSlice.origin?.iata_code || "Unknown";
      const toLocation = lastSlice.destination?.iata_code || "Unknown";
      subject = `${fromLocation} → ${toLocation} - ${t.zapbookingReference} ${bookingData.duffel_booking_reference || bookingReference}`;
    }

    const emailResponse = await resend.emails.send({
      from: "ZapAround <noreply@zaparound.com>",
      to: [recipientEmail],
      subject: subject,
      html: emailHtml,
      attachments: calendarEvents.length > 0 ? [
        {
          filename: `flight-booking-${bookingReference}.ics`,
          content: icsContent,
          contentType: 'text/calendar'
        }
      ] : undefined
    });

    console.log("Booking email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Booking details sent successfully",
        emailId: emailResponse.id 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error) {
    console.error("Error sending booking email:", error);
    return new Response(
      JSON.stringify({ 
        error: "Failed to send booking email",
        details: error.message 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
}); 