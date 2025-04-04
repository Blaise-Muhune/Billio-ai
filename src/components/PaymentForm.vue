<template>
  <div class="payment-form">
    <div v-if="error" class="error-message text-red-600 mb-4">
      {{ error }}
    </div>
    <div id="payment-element" ref="paymentElement"></div>
    <button
      @click="handleSubmit"
      :disabled="loading"
      class="w-full mt-4 bg-emerald-500 text-white px-6 py-3 rounded-xl hover:bg-emerald-600 transition-colors duration-200 flex items-center justify-center"
    >
      <div v-if="loading" class="loading-spinner w-4 h-4 border-2 mr-2"></div>
      <span>{{ loading ? 'Processing...' : 'Pay Now' }}</span>
    </button>
  </div>
</template>

<script setup>
import { ref, onMounted, defineProps, defineEmits } from 'vue';
import { loadStripe } from '@stripe/stripe-js';

const props = defineProps({
  clientSecret: {
    type: String,
    required: true
  }
});

const emit = defineEmits(['success', 'error']);
const error = ref('');
const loading = ref(false);
const stripe = ref(null);
const elements = ref(null);
const paymentElement = ref(null);

onMounted(async () => {
  try {
    // Initialize Stripe
    stripe.value = await loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
    
    // Create payment element
    elements.value = stripe.value.elements({
      clientSecret: props.clientSecret,
      appearance: {
        theme: 'stripe',
        variables: {
          colorPrimary: '#10b981',
        }
      }
    });

    // Mount the payment element
    const element = elements.value.create('payment');
    await element.mount(paymentElement.value);
  } catch (err) {
    console.error('Error initializing payment form:', err);
    error.value = 'Failed to load payment form. Please try again.';
  }
});

const handleSubmit = async () => {
  if (!stripe.value || !elements.value) {
    return;
  }

  loading.value = true;
  error.value = '';

  try {
    const { error: submitError } = await stripe.value.confirmPayment({
      elements: elements.value,
      confirmParams: {
        return_url: window.location.origin + '/subscription'
      }
    });

    if (submitError) {
      error.value = submitError.message;
      emit('error', submitError);
    } else {
      emit('success');
    }
  } catch (err) {
    console.error('Payment error:', err);
    error.value = 'Payment failed. Please try again.';
    emit('error', err);
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.payment-form {
  max-width: 500px;
  margin: 0 auto;
  padding: 20px;
}

.loading-spinner {
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid #ffffff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style> 