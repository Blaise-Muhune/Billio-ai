import { SUBSCRIPTION_PLANS } from '../../config/serverStripe.js';
import { toDate } from './helpers.js';

function planFromPriceId(priceId) {
  if (!priceId) return { plan: null, billingCycle: null };
  if (priceId === process.env.STRIPE_PRO_PRICE_ID) return { plan: 'PRO', billingCycle: 'monthly' };
  if (priceId === process.env.STRIPE_BASIC_PRICE_ID) return { plan: 'BASIC', billingCycle: 'monthly' };
  if (priceId === process.env.STRIPE_PRO_YEARLY_PRICE_ID) return { plan: 'PRO', billingCycle: 'yearly' };
  if (priceId === process.env.STRIPE_BASIC_YEARLY_PRICE_ID) return { plan: 'BASIC', billingCycle: 'yearly' };
  return { plan: null, billingCycle: null };
}

/**
 * Silent reconcile: Stripe is source of truth for active subscriptions.
 * No emails — fixes drift only.
 */
export async function runStripeReconcile({ db, stripe, now = new Date() }) {
  const summary = { checked: 0, fixed: 0, errors: [] };

  const snap = await db
    .collection('users')
    .where('plan', 'in', ['BASIC', 'PRO'])
    .limit(200)
    .get();

  for (const userDoc of snap.docs) {
    const userData = userDoc.data();
    const subId = userData.subscriptionId || userData.stripeSubscriptionId;
    if (!subId) continue;

    summary.checked += 1;
    try {
      const subscription = await stripe.subscriptions.retrieve(subId);
      const priceId = subscription.items?.data?.[0]?.price?.id;
      const mapped = planFromPriceId(priceId);
      const endDate = new Date(subscription.current_period_end * 1000);

      const patch = {};
      if (subscription.status === 'active' || subscription.status === 'trialing') {
        if (userData.subscriptionStatus !== subscription.status) {
          patch.subscriptionStatus = subscription.status;
        }
        if (mapped.plan && userData.plan !== mapped.plan) {
          patch.plan = mapped.plan;
          const limits =
            SUBSCRIPTION_PLANS[mapped.plan]?.limits || SUBSCRIPTION_PLANS.BASIC.limits;
          patch.limits = {
            maxCards: limits.maxCards,
            maxEvents: limits.maxEvents,
            maxDraftsPerCard: limits.maxDraftsPerCard
          };
        }
        if (mapped.billingCycle && userData.billingCycle !== mapped.billingCycle) {
          patch.billingCycle = mapped.billingCycle;
        }
        const localEnd = toDate(userData.subscriptionEndDate);
        if (!localEnd || Math.abs(localEnd.getTime() - endDate.getTime()) > 60_000) {
          patch.subscriptionEndDate = endDate;
        }
      } else if (
        subscription.status === 'canceled' ||
        subscription.status === 'unpaid' ||
        subscription.cancel_at_period_end
      ) {
        // Respect period end; only mark canceled if Stripe says so
        if (subscription.status === 'canceled' && endDate <= now && userData.plan !== 'FREE') {
          const free = SUBSCRIPTION_PLANS.FREE.limits;
          patch.plan = 'FREE';
          patch.limits = {
            maxCards: free.maxCards,
            maxEvents: free.maxEvents,
            maxDraftsPerCard: free.maxDraftsPerCard
          };
          patch.subscriptionStatus = 'canceled';
          patch.subscriptionId = null;
        } else if (subscription.cancel_at_period_end || subscription.status === 'canceled') {
          if (userData.subscriptionStatus !== 'canceled') {
            patch.subscriptionStatus = 'canceled';
          }
          patch.subscriptionEndDate = endDate;
        }
      }

      if (Object.keys(patch).length) {
        patch.updatedAt = now;
        patch.lastStripeReconcileAt = now;
        await userDoc.ref.update(patch);
        summary.fixed += 1;
      }
    } catch (err) {
      if (err?.code === 'resource_missing') {
        try {
          const free = SUBSCRIPTION_PLANS.FREE.limits;
          await userDoc.ref.update({
            subscriptionId: null,
            subscriptionStatus: 'canceled',
            plan: 'FREE',
            limits: {
              maxCards: free.maxCards,
              maxEvents: free.maxEvents,
              maxDraftsPerCard: free.maxDraftsPerCard
            },
            updatedAt: now,
            lastStripeReconcileAt: now
          });
          summary.fixed += 1;
        } catch (inner) {
          summary.errors.push({ userId: userDoc.id, error: inner.message });
        }
      } else {
        summary.errors.push({ userId: userDoc.id, error: err.message });
      }
    }
  }

  return summary;
}
