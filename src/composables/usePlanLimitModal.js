import { ref } from 'vue';

export function usePlanLimitModal() {
  const showModal = ref(false);
  const modalMessage = ref('');

  const showPlanLimitModal = (message) => {
    modalMessage.value = message;
    showModal.value = true;
  };

  const hidePlanLimitModal = () => {
    showModal.value = false;
  };

  return {
    showModal,
    modalMessage,
    showPlanLimitModal,
    hidePlanLimitModal
  };
} 