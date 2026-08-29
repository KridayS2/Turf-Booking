/**
 * TurfSync Initial Mock Dataset
 * Provides rich multi-venue, court, dynamic pricing, and booking data for Mumbai.
 */

const DEFAULT_DATA = {
  venues: [
    {
      id: "venue-1",
      name: "Apex Arena Sports Complex",
      tagline: "Premier FIFA-Grade AstroTurf & Multi-Sport Facility in BKC",
      description: "State-of-the-art sports arena in Bandra-Kurla Complex featuring FIFA 2-star certified artificial grass turf, floodlit courts, locker rooms, cafeteria, and ample parking.",
      address: "Plot 42, G-Block, Bandra-Kurla Complex (BKC)",
      city: "Mumbai",
      sports: ["FOOTBALL", "CRICKET"],
      rating: 4.8,
      reviewCount: 124,
      image: "https://images.unsplash.com/photo-1529900245534-47fbfb57835a?auto=format&fit=crop&w=800&q=80",
      cancellationPolicyHours: 24,
      openingTime: "06:00",
      closingTime: "23:00",
      courts: [
        {
          id: "court-1",
          name: "Main Arena 7v7 Turf",
          sport: "FOOTBALL",
          surface: "FIFA 2-Star AstroTurf",
          isIndoor: false,
          baseRate: 1800, // INR per hour
          isActive: true
        },
        {
          id: "court-2",
          name: "Thunder Box Cricket Pitch",
          sport: "CRICKET",
          surface: "High-Bounce Synthetic Carpet with Nets",
          isIndoor: true,
          baseRate: 1400,
          isActive: true
        },
        {
          id: "court-3",
          name: "Pro Court 1 Badminton",
          sport: "BADMINTON",
          surface: "Yonex Wooden Sprung Synthetic",
          isIndoor: true,
          baseRate: 750,
          isActive: true
        }
      ]
    },
    {
      id: "venue-2",
      name: "KickOff Urban Turf",
      tagline: "Downtown 5v5 Football & High-Energy Night Matches in Andheri",
      description: "Centrally located rooftop turf on Link Road, Andheri West with LED stadium illumination, pro-grade netting, and live match replay screens.",
      address: "SkyDeck Level 4, Crystal Point Mall, Link Road, Andheri West",
      city: "Mumbai",
      sports: ["FOOTBALL", "CRICKET"],
      rating: 4.6,
      reviewCount: 89,
      image: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80",
      cancellationPolicyHours: 24,
      openingTime: "06:00",
      closingTime: "24:00",
      courts: [
        {
          id: "court-4",
          name: "SkyTurf 5v5 Football",
          sport: "FOOTBALL",
          surface: "50mm Mono-Filament Grass",
          isIndoor: false,
          baseRate: 1600,
          isActive: true
        },
        {
          id: "court-5",
          name: "Rooftop Cricket Cage",
          sport: "CRICKET",
          surface: "Astro Matting",
          isIndoor: false,
          baseRate: 1200,
          isActive: true
        }
      ]
    },
    {
      id: "venue-3",
      name: "Smash Point Tennis & Pickleball Club",
      tagline: "International Standard Acrylic & Hard Courts in Juhu",
      description: "Dedicated racquet sport center in Juhu featuring 2 US Open-cushioned tennis courts and 2 fast-paced pickleball courts.",
      address: "12 Palm Avenue, Near Juhu Beach",
      city: "Mumbai",
      sports: ["TENNIS", "PICKLEBALL"],
      rating: 4.9,
      reviewCount: 62,
      image: "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=800&q=80",
      cancellationPolicyHours: 24,
      openingTime: "06:00",
      closingTime: "22:00",
      courts: [
        {
          id: "court-6",
          name: "Centre Court Tennis",
          sport: "TENNIS",
          surface: "DecoTurf Acrylic Cushion",
          isIndoor: false,
          baseRate: 1100,
          isActive: true
        },
        {
          id: "court-7",
          name: "Pickleball Court Alpha",
          sport: "PICKLEBALL",
          surface: "Pro-X Hardcoat",
          isIndoor: true,
          baseRate: 850,
          isActive: true
        }
      ]
    }
  ],

  pricingRules: [
    {
      id: "rule-1",
      venueId: "venue-1",
      name: "Evening Peak Rush",
      days: [1, 2, 3, 4, 5, 6, 7], // All days
      startTime: "18:00",
      endTime: "22:00",
      multiplier: 1.30, // +30% surge
      badgeText: "Peak Hours (+30%)"
    },
    {
      id: "rule-2",
      venueId: "venue-1",
      name: "Weekend All-Day Surge",
      days: [6, 7], // Sat & Sun
      startTime: "07:00",
      endTime: "22:00",
      multiplier: 1.20, // +20% weekend surge
      badgeText: "Weekend Surge (+20%)"
    },
    {
      id: "rule-3",
      venueId: "venue-1",
      name: "Early Bird Discount",
      days: [1, 2, 3, 4, 5],
      startTime: "06:00",
      endTime: "09:00",
      multiplier: 0.85, // 15% discount
      badgeText: "Early Bird (-15%)"
    },
    {
      id: "rule-4",
      venueId: "venue-2",
      name: "Night Owls Rush",
      days: [5, 6, 7], // Fri, Sat, Sun
      startTime: "20:00",
      endTime: "24:00",
      multiplier: 1.25,
      badgeText: "Night Rush (+25%)"
    }
  ],

  bookings: [
    {
      id: "TS-2026-8801",
      venueId: "venue-1",
      courtId: "court-1",
      courtName: "Main Arena 7v7 Turf",
      sport: "FOOTBALL",
      venueName: "Apex Arena Sports Complex",
      userId: "user-1",
      userName: "Alex Morgan",
      userEmail: "alex.player@example.com",
      userPhone: "+91 98765 43210",
      date: new Date().toISOString().split('T')[0], // Today
      startTime: "19:00",
      endTime: "20:00",
      totalAmount: 2340,
      status: "CONFIRMED",
      paymentStatus: "SUCCEEDED",
      paymentMethod: "Stripe Card (•••• 4242)",
      isRecurring: false,
      createdAt: new Date().toISOString()
    },
    {
      id: "TS-2026-8802",
      venueId: "venue-1",
      courtId: "court-1",
      courtName: "Main Arena 7v7 Turf",
      sport: "FOOTBALL",
      venueName: "Apex Arena Sports Complex",
      userId: "user-2",
      userName: "Rahul Sharma",
      userEmail: "rahul.s@example.com",
      userPhone: "+91 98888 12345",
      date: new Date().toISOString().split('T')[0], // Today
      startTime: "20:00",
      endTime: "21:00",
      totalAmount: 2340,
      status: "CONFIRMED",
      paymentStatus: "SUCCEEDED",
      paymentMethod: "Stripe UPI",
      isRecurring: true,
      createdAt: new Date().toISOString()
    },
    {
      id: "TS-2026-8803",
      venueId: "venue-1",
      courtId: "court-2",
      courtName: "Thunder Box Cricket Pitch",
      sport: "CRICKET",
      venueName: "Apex Arena Sports Complex",
      userId: "user-3",
      userName: "Walk-in Offline Player",
      userEmail: "offline@turf.local",
      userPhone: "+91 99999 00000",
      date: new Date().toISOString().split('T')[0],
      startTime: "18:00",
      endTime: "19:00",
      totalAmount: 1820,
      status: "CONFIRMED",
      paymentStatus: "SUCCEEDED",
      paymentMethod: "Cash / Counter",
      isRecurring: false,
      createdAt: new Date().toISOString()
    }
  ],

  waitlist: [
    {
      id: "wl-1",
      courtId: "court-1",
      date: new Date().toISOString().split('T')[0],
      startTime: "19:00",
      userId: "user-4",
      userName: "Daniel Craig",
      userEmail: "daniel@example.com",
      status: "WAITING",
      createdAt: new Date().toISOString()
    }
  ],

  reviews: [
    {
      id: "rev-1",
      venueId: "venue-1",
      userName: "Karthik R.",
      rating: 5,
      date: "2026-08-20",
      comment: "Best turf in Mumbai! Lighting in BKC is super bright, ball roll is true, and the automated slot booking saves so much time compared to calling."
    },
    {
      id: "rev-2",
      venueId: "venue-1",
      userName: "Samantha M.",
      rating: 5,
      date: "2026-08-18",
      comment: "Super smooth checkout. Got an instant refund when we cancelled 2 days prior without hassle."
    },
    {
      id: "rev-3",
      venueId: "venue-2",
      userName: "Vikram Sen",
      rating: 4,
      date: "2026-08-15",
      comment: "Great rooftop vibe in Andheri for 5v5 football! Booking system showed exact peak pricing upfront."
    }
  ]
};
