export const SUBSCRIPTION_PLANS = {
  FREE: {
    name: 'Free',
    price: 0,
    limits: {
      maxCards: 5,
      maxEvents: 2,
      maxDraftsPerCard: 1
    }
  },
  BASIC: {
    name: 'Basic',
    price: 9.99,
    limits: {
      maxCards: 50,
      maxEvents: 10,
      maxDraftsPerCard: 3
    }
  },
  PRO: {
    name: 'Pro',
    price: 19.99,
    limits: {
      maxCards: 500,
      maxEvents: 50,
      maxDraftsPerCard: 10
    }
  }
}; 