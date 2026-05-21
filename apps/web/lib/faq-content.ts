export interface FaqItem {
  id: string
  category: string
  question: string
  answer: string
  keywords: string[]
}

export const FAQ_ITEMS: FaqItem[] = [
  // ── Booking ───────────────────────────────────────────────────────────────
  {
    id: 'book-how',
    category: 'Booking',
    question: 'How do I book a vehicle?',
    answer:
      'Browse available vehicles on the homepage, select your dates, choose any extras (insurance, GPS, etc.), provide your driver details and licence, then pay online by card or bank transfer. You will receive a confirmation email with your booking reference immediately.',
    keywords: ['book', 'reserve', 'how', 'process', 'steps'],
  },
  {
    id: 'book-advance',
    category: 'Booking',
    question: 'How far in advance can I book?',
    answer:
      'Up to 6 months in advance. Same-day bookings are accepted subject to vehicle availability. We recommend booking at least 48 hours ahead for guaranteed availability.',
    keywords: ['advance', 'early', 'same day', 'last minute', 'how soon'],
  },
  {
    id: 'book-modify',
    category: 'Booking',
    question: 'Can I change my booking dates or vehicle?',
    answer:
      'Yes. Changes are free if made more than 24 hours before pickup, subject to availability. Changes within 24 hours may incur a €15 amendment fee. Contact us at bookings@reci-transport.de or through your account page.',
    keywords: ['change', 'modify', 'amend', 'update', 'dates', 'extend'],
  },
  {
    id: 'book-cancel',
    category: 'Booking',
    question: 'What is the cancellation policy?',
    answer:
      'Free cancellation up to 48 hours before pickup. Cancellations 24–48 hours before: 25% charge. Cancellations under 24 hours: 50% charge. No-shows: 100% charge. To cancel, go to My Bookings in your account or email bookings@reci-transport.de.',
    keywords: ['cancel', 'cancellation', 'refund', 'policy', 'charge', 'no-show'],
  },
  {
    id: 'book-ref',
    category: 'Booking',
    question: 'Where do I find my booking reference?',
    answer:
      'Your booking reference (format: RT-XXXXX) is in your confirmation email and visible under My Bookings in your account. You will need it at pickup.',
    keywords: ['reference', 'booking number', 'confirmation', 'code', 'RT-'],
  },

  // ── Payment ───────────────────────────────────────────────────────────────
  {
    id: 'pay-methods',
    category: 'Payment',
    question: 'What payment methods do you accept?',
    answer:
      'We accept Visa, Mastercard, and American Express (via Stripe). Corporate accounts can pay by bank transfer or invoice. Cash is accepted at the counter for walk-in bookings only.',
    keywords: ['pay', 'payment', 'card', 'credit', 'debit', 'bank transfer', 'invoice', 'cash', 'stripe'],
  },
  {
    id: 'pay-deposit',
    category: 'Payment',
    question: 'Is there a security deposit?',
    answer:
      'Yes. A pre-authorisation hold of €300–€500 (depending on vehicle tier) is placed on your credit card at pickup. This is released within 5–7 business days after return, provided no damage is found.',
    keywords: ['deposit', 'hold', 'pre-auth', 'security', 'blocked', 'charge'],
  },
  {
    id: 'pay-invoice',
    category: 'Payment',
    question: 'Can I get an invoice for my rental?',
    answer:
      'Yes. A VAT invoice is automatically emailed after your rental is completed. Corporate accounts receive invoices according to their agreed billing cycle. You can also download invoices from My Bookings.',
    keywords: ['invoice', 'receipt', 'VAT', 'billing', 'tax', 'document'],
  },

  // ── Driver Requirements ───────────────────────────────────────────────────
  {
    id: 'driver-age',
    category: 'Driver Requirements',
    question: 'What is the minimum age to rent?',
    answer:
      'Minimum age is 21. Drivers aged 21–24 may rent economy and compact vehicles only, with a young driver surcharge of €10/day. Drivers 25 and older may rent any vehicle category.',
    keywords: ['age', 'minimum', 'young driver', '21', '25', 'how old'],
  },
  {
    id: 'driver-licence',
    category: 'Driver Requirements',
    question: 'What licence do I need?',
    answer:
      'A valid EU/EEA driving licence (category B or higher) held for at least 2 years is required. Non-EU licences must be accompanied by an official translation or International Driving Permit (IDP). Licences are verified via our AI scanner at booking.',
    keywords: ['licence', 'license', 'driving', 'permit', 'IDP', 'international', 'foreign', 'EU'],
  },
  {
    id: 'driver-additional',
    category: 'Driver Requirements',
    question: 'Can I add an additional driver?',
    answer:
      'Yes. Additional drivers can be added at checkout for €5/day per driver. They must be present at pickup with their driving licence. All drivers are covered under the rental insurance.',
    keywords: ['additional driver', 'second driver', 'extra driver', 'shared driving'],
  },
  {
    id: 'driver-bring',
    category: 'Driver Requirements',
    question: 'What do I need to bring at pickup?',
    answer:
      'Bring: (1) your valid driving licence, (2) your booking confirmation or booking reference, (3) the credit/debit card used for payment (for deposit hold). No passport required for EU residents.',
    keywords: ['bring', 'pickup', 'documents', 'needed', 'require', 'collect'],
  },

  // ── Vehicles & Fleet ──────────────────────────────────────────────────────
  {
    id: 'fleet-categories',
    category: 'Fleet',
    question: 'What vehicle categories do you offer?',
    answer:
      'We offer four categories: Economy (city cars, 5 seats, e.g. VW Golf, Renault Clio), Compact (mid-size, 5 seats, e.g. BMW 3 Series), SUV (7 seats, e.g. Toyota RAV4, Audi Q5), and Van (cargo/passenger vans up to 12 m³, e.g. Mercedes Sprinter, Ford Transit).',
    keywords: ['category', 'types', 'fleet', 'economy', 'compact', 'SUV', 'van', 'what vehicles', 'options'],
  },
  {
    id: 'fleet-electric',
    category: 'Fleet',
    question: 'Do you have electric vehicles?',
    answer:
      'Yes. We have electric vehicles in our economy and compact categories. Electric vehicles include charging cable adapters. We recommend planning charging stops using PlugShare or ADAC e-charging maps for longer trips.',
    keywords: ['electric', 'EV', 'charging', 'plug', 'battery', 'zero emission', 'hybrid'],
  },
  {
    id: 'fleet-specific',
    category: 'Fleet',
    question: 'Can I request a specific model?',
    answer:
      'You can filter by fuel type, transmission, and category. The exact model is not guaranteed within a category ("or similar" applies), but we aim to provide the advertised vehicle or an upgrade when possible.',
    keywords: ['specific model', 'exact', 'guarantee', 'request', 'similar', 'upgrade'],
  },

  // ── Insurance ─────────────────────────────────────────────────────────────
  {
    id: 'ins-included',
    category: 'Insurance',
    question: 'What insurance is included?',
    answer:
      'Third-party liability insurance is included in all rentals as required by German law. This covers damage you cause to others. Damage to the rental vehicle itself is covered by a Collision Damage Waiver (CDW) add-on — we recommend selecting one at checkout.',
    keywords: ['insurance', 'included', 'covered', 'liability', 'TPL', 'CDW'],
  },
  {
    id: 'ins-cdw',
    category: 'Insurance',
    question: 'What is CDW and do I need it?',
    answer:
      'Collision Damage Waiver (CDW) reduces your liability for damage to the rental vehicle to a fixed excess (typically €500–€1,500). Without CDW, you are liable for the full repair cost up to the vehicle value. We strongly recommend CDW for peace of mind.',
    keywords: ['CDW', 'collision', 'damage waiver', 'excess', 'liability', 'cover', 'full cover'],
  },
  {
    id: 'ins-damage',
    category: 'Insurance',
    question: 'What happens if the vehicle is damaged during my rental?',
    answer:
      'Report any damage immediately via the app or call +49 30 000 0000. Our AI inspection system photographs the vehicle at pickup and return to assess any new damage. If damage is found at return and you have CDW, you pay the excess. Without CDW, you pay for repairs. Do not drive a damaged vehicle — stop safely and contact us.',
    keywords: ['damage', 'accident', 'scratch', 'dent', 'broken', 'hit', 'crash', 'report'],
  },

  // ── Fuel ──────────────────────────────────────────────────────────────────
  {
    id: 'fuel-policy',
    category: 'Fuel',
    question: 'What is the fuel policy?',
    answer:
      'Full-to-full policy: vehicles are provided with a full tank. You must return them with a full tank. If returned with less fuel, we charge for the missing fuel plus a €25 refuelling service fee. Electric vehicles must be returned with at least 80% charge.',
    keywords: ['fuel', 'petrol', 'diesel', 'full tank', 'return', 'policy', 'charge', 'refuel'],
  },
  {
    id: 'fuel-electric',
    category: 'Fuel',
    question: 'How do I charge an electric rental vehicle?',
    answer:
      'All electric vehicles come with a Type 2 charging cable. You can charge at public stations (IONITY, Allego, EnBW, or any CCS/Type 2 compatible charger). Charging costs are not included in the rental. Return with at least 80% charge to avoid a €25 top-up fee.',
    keywords: ['charge', 'electric', 'charging station', 'cable', 'Type 2', 'CCS', 'IONITY', 'EV'],
  },

  // ── Pickup & Return ───────────────────────────────────────────────────────
  {
    id: 'pickup-location',
    category: 'Pickup & Return',
    question: 'Where do I pick up my vehicle?',
    answer:
      'All vehicles are collected from RECI Transport HQ in Berlin. The exact address and directions are in your confirmation email. Free parking is available for your personal vehicle during the rental period.',
    keywords: ['pickup', 'location', 'address', 'where', 'collect', 'Berlin', 'HQ'],
  },
  {
    id: 'pickup-hours',
    category: 'Pickup & Return',
    question: 'What are your opening hours?',
    answer:
      'Monday–Friday: 08:00–19:00. Saturday: 09:00–17:00. Sunday: 10:00–15:00. Out-of-hours key collection is available for pre-approved bookings — contact us at least 24 hours in advance to arrange.',
    keywords: ['hours', 'opening', 'open', 'closed', 'Sunday', 'Saturday', 'time', 'when'],
  },
  {
    id: 'pickup-late',
    category: 'Pickup & Return',
    question: 'What if I return the vehicle late?',
    answer:
      'A grace period of 30 minutes applies. After that, a late fee of €25/hour is charged, up to one additional full day rate. Please call us if you anticipate being late so we can advise on options.',
    keywords: ['late', 'late return', 'overdue', 'extension', 'extra time', 'fee'],
  },
  {
    id: 'pickup-early',
    category: 'Pickup & Return',
    question: 'Can I return the vehicle early?',
    answer:
      'Yes, but no refund is given for unused days unless a Flexible Rate was selected at booking. Early return of a vehicle reserved by another customer is appreciated — please notify us as early as possible.',
    keywords: ['early', 'return early', 'finish early', 'refund', 'days unused'],
  },

  // ── Mileage ───────────────────────────────────────────────────────────────
  {
    id: 'mileage',
    category: 'Mileage',
    question: 'Is mileage unlimited?',
    answer:
      'Standard rentals include 300 km/day (unlimited on rentals 7 days or longer). If you exceed the limit, an excess mileage charge of €0.15/km applies. Check your booking confirmation for your specific allowance.',
    keywords: ['mileage', 'km', 'unlimited', 'distance', 'kilometre', 'limit', 'excess'],
  },

  // ── Corporate ─────────────────────────────────────────────────────────────
  {
    id: 'corp-account',
    category: 'Corporate',
    question: 'Do you offer corporate accounts?',
    answer:
      'Yes. Corporate accounts get negotiated rates, monthly invoicing, dedicated account management, and access to the full fleet including vans. Apply via the Corporate section in your account or email corporate@reci-transport.de.',
    keywords: ['corporate', 'business', 'company', 'account', 'B2B', 'fleet', 'invoice'],
  },
]

/**
 * Simple keyword search over FAQ items.
 * Returns up to `limit` most relevant items.
 */
export function searchFaq(query: string, limit = 5): FaqItem[] {
  const terms = query
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 2)

  if (terms.length === 0) return FAQ_ITEMS.slice(0, limit)

  const scored = FAQ_ITEMS.map((item) => {
    const haystack = [
      item.question.toLowerCase(),
      item.answer.toLowerCase(),
      item.category.toLowerCase(),
      ...item.keywords,
    ].join(' ')

    const score = terms.reduce((acc, term) => {
      const kwMatch = item.keywords.some((k) => k.includes(term)) ? 3 : 0
      const qMatch = item.question.toLowerCase().includes(term) ? 2 : 0
      const aMatch = haystack.includes(term) ? 1 : 0
      return acc + kwMatch + qMatch + aMatch
    }, 0)

    return { item, score }
  })

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.item)
}
