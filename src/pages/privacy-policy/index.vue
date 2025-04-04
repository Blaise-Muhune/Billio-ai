<template>
  <div class="max-w-4xl mx-auto px-4 py-12">
    <h1 class="text-3xl font-bold text-gray-900 mb-8">Privacy Policy</h1>
    <div class="space-y-8 text-gray-700">
      <!-- Last Updated -->
      <p class="text-sm text-gray-500">Last Updated: {{ currentDate }}</p>

      <!-- Introduction -->
      <section>
        <h2 class="text-2xl font-semibold text-gray-900 mb-4">Introduction</h2>
        <p class="mb-4">
          Welcome to BilloAI ("we," "our," or "us"). We respect your privacy and are committed to protecting your personal data. This privacy policy will inform you about how we handle your personal data when you visit our website and use our services, and tell you about your privacy rights and how the law protects you.
        </p>
      </section>

      <!-- Information We Collect -->
      <section>
        <h2 class="text-2xl font-semibold text-gray-900 mb-4">Information We Collect</h2>
        <div class="space-y-4">
          <p>We collect and process the following types of personal information:</p>
          <ul class="list-disc pl-6 space-y-2">
            <li><strong>Account Information:</strong> Email address, password, and profile details</li>
            <li><strong>Business Card Information:</strong> Contact details from scanned or manually entered business cards</li>
            <li><strong>Usage Data:</strong> Information about how you use our service, including analytics and interaction data</li>
            <li><strong>Payment Information:</strong> When you subscribe to our paid services (processed securely through Stripe)</li>
            <li><strong>Communication Data:</strong> Your preferences for receiving communications from us</li>
            <li><strong>Technical Data:</strong> IP address, browser type, device information, and cookies</li>
          </ul>
        </div>
      </section>

      <!-- How We Use Your Information -->
      <section>
        <h2 class="text-2xl font-semibold text-gray-900 mb-4">How We Use Your Information</h2>
        <div class="space-y-4">
          <p>We use your personal information for the following purposes:</p>
          <ul class="list-disc pl-6 space-y-2">
            <li>To provide and maintain our service</li>
            <li>To process and manage your subscription</li>
            <li>To enable business card scanning and contact management</li>
            <li>To send you service updates and important notices</li>
            <li>To improve and personalize our services</li>
            <li>To provide customer support</li>
            <li>To detect and prevent fraud</li>
            <li>To comply with legal obligations</li>
          </ul>
        </div>
      </section>

      <!-- Data Sharing and Third Parties -->
      <section>
        <h2 class="text-2xl font-semibold text-gray-900 mb-4">Data Sharing and Third Parties</h2>
        <p class="mb-4">We share your information with:</p>
        <ul class="list-disc pl-6 space-y-2">
          <li><strong>Stripe:</strong> For processing payments and managing subscriptions</li>
          <li><strong>Firebase:</strong> For user authentication and data storage</li>
          <li><strong>Service Providers:</strong> Who assist in operating our service</li>
          <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
        </ul>
      </section>

      <!-- Data Security -->
      <section>
        <h2 class="text-2xl font-semibold text-gray-900 mb-4">Data Security</h2>
        <p>
          We implement appropriate security measures to protect your personal information. These include encryption, secure servers, and regular security assessments. However, no method of transmission over the Internet or electronic storage is 100% secure.
        </p>
      </section>

      <!-- Your Rights -->
      <section>
        <h2 class="text-2xl font-semibold text-gray-900 mb-4">Your Rights</h2>
        <p class="mb-4">You have the right to:</p>
        <ul class="list-disc pl-6 space-y-2">
          <li>Access your personal data</li>
          <li>Correct inaccurate data</li>
          <li>Request deletion of your data</li>
          <li>Object to processing of your data</li>
          <li>Request transfer of your data</li>
          <li>Withdraw consent at any time</li>
        </ul>
      </section>

      <!-- Data Retention -->
      <section>
        <h2 class="text-2xl font-semibold text-gray-900 mb-4">Data Retention</h2>
        <p>
          We retain your personal data only for as long as necessary to fulfill the purposes for which we collected it, including for legal, accounting, or reporting requirements. When you delete your account, we will delete or anonymize your data unless required by law to retain it.
        </p>
      </section>

      <!-- Children's Privacy -->
      <section>
        <h2 class="text-2xl font-semibold text-gray-900 mb-4">Children's Privacy</h2>
        <p>
          Our service is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13.
        </p>
      </section>

      <!-- Changes to Privacy Policy -->
      <section>
        <h2 class="text-2xl font-semibold text-gray-900 mb-4">Changes to Privacy Policy</h2>
        <p>
          We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date.
        </p>
      </section>

      <!-- Contact Us -->
      <section>
        <h2 class="text-2xl font-semibold text-gray-900 mb-4">Contact Us</h2>
        <p>
          If you have any questions about this Privacy Policy, please contact us at:
          <a href="mailto:privacy@billoai.com" class="text-emerald-600 hover:text-emerald-700">privacy@billoai.com</a>
        </p>
      </section>
    </div>
  </div>
</template>

<script setup>
const currentDate = new Date().toLocaleDateString('en-US', {
  year: 'numeric',
  month: 'long',
  day: 'numeric'
});
</script>

<style scoped>
section {
  @apply bg-white rounded-lg p-6 shadow-sm border border-gray-100;
}
</style> 