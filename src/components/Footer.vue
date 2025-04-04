<template>
  <footer class="bg-white border-t border-gray-100 py-4 mt-auto">
    <div class="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center text-sm text-gray-600">
      <div class="mb-2 sm:mb-0">
        © {{ currentYear }} BilloAI. All rights reserved.
      </div>
      <nav class="flex items-center space-x-6">
        <router-link 
          to="/privacy-policy" 
          class="hover:text-emerald-600 transition-colors duration-200"
        >
          Privacy Policy
        </router-link>
        <a 
          href="mailto:contact@billoai.com" 
          class="hover:text-emerald-600 transition-colors duration-200"
        >
          Contact
        </a>
      </nav>
    </div>
  </footer>
</template>

<script setup>
const currentYear = new Date().getFullYear();
</script> 