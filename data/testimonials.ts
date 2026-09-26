/**
 * SAMPLE reviews so the carousel has content. Replace them with real customer
 * reviews before launch, then remove the "sample reviews" note in
 * components/sections/Testimonials.tsx.
 */
export interface Testimonial {
  id: string;
  name: string;
  city: string;
  product: string;
  rating: 1 | 2 | 3 | 4 | 5;
  quote: string;
}

export const testimonials: Testimonial[] = [
  {
    id: 't1',
    name: 'Lakshmi R.',
    city: 'Bengaluru',
    product: 'Teak Chakla-Belan Set',
    rating: 5,
    quote:
      'The chakla is so heavy and smooth that my rotis finally come out round. It smells faintly of coconut oil and looks beautiful on the counter.',
  },
  {
    id: 't2',
    name: 'Meera S.',
    city: 'Kochi',
    product: 'Bench Coconut Scraper',
    rating: 5,
    quote:
      'Exactly like the thuruvani my grandmother had. The teeth grate fine and fluffy coconut, and the bench is sturdy enough for my father to sit on.',
  },
  {
    id: 't3',
    name: 'Anand K.',
    city: 'Pune',
    product: 'Gruhapravesha Housewarming Set',
    rating: 5,
    quote:
      'We gifted the housewarming crate to my sister. Everyone at the pooja wanted to know where it was from. The branded crate is a lovely touch.',
  },
  {
    id: 't4',
    name: 'Divya P.',
    city: 'Hyderabad',
    product: 'Neem Mathani',
    rating: 4,
    quote: 'Buttermilk in thirty seconds, and butter in a few minutes. Light, well finished and easy to wash.',
  },
  {
    id: 't5',
    name: 'Rafiq M.',
    city: 'Chennai',
    product: 'Wholesale order, 120 gift sets',
    rating: 5,
    quote:
      'Ordered spoon and spatula sets as return gifts for a wedding. Every set was tied and tagged, packed by name, and delivered two days early.',
  },
  {
    id: 't6',
    name: 'Sneha J.',
    city: 'Mumbai',
    product: 'Aromatic Masala Dabba',
    rating: 5,
    quote: 'The lid closes so snugly that the spices stay fresh for weeks. The grain on the sheesham is stunning.',
  },
];
