/**
 * Static test data. Products are referenced by name (what a user sees) and by
 * id (what the API uses). Prices are asserted from the UI/API at runtime, so a
 * price change on the site does not break tests that only compare totals.
 */
export const PRODUCTS = {
  samsungGalaxyS6: { id: 1, name: 'Samsung galaxy s6', category: 'Phones' },
  nokiaLumia1520: { id: 2, name: 'Nokia lumia 1520', category: 'Phones' },
  sonyVaioI5: { id: 8, name: 'Sony vaio i5', category: 'Laptops' },
  appleMonitor24: { id: 10, name: 'Apple monitor 24', category: 'Monitors' },
} as const;

export const MESSAGES = {
  fillLogin: 'Please fill out Username and Password.',
  wrongPassword: 'Wrong password.',
  userNotExist: 'User does not exist.',
  signUpSuccess: 'Sign up successful.',
  userAlreadyExist: 'This user already exist.',
  productAdded: /Product added/i,
  fillOrder: 'Please fill out Name and Creditcard.',
  purchaseSuccess: 'Thank you for your purchase!',
} as const;

export interface OrderDetails {
  name: string;
  country: string;
  city: string;
  card: string;
  month: string;
  year: string;
}

export const VALID_ORDER: OrderDetails = {
  name: 'QA Automation',
  country: 'Vietnam',
  city: 'Can Tho',
  card: '4111111111111111',
  month: '10',
  year: '2026',
};
