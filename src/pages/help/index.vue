<template lang="pug">
main.billo-app-bg.font-sans
  .mx-auto.max-w-3xl.px-4.py-12(class="sm:px-6")
    article.billo-card-elevated.billo-motion.space-y-8.p-6(class="sm:p-10")
      header
        h1.mb-2.text-3xl.font-bold.tracking-tight.text-slate-900 Help
        p.text-slate-600 The 60-second loop: capture someone you met → get a draft → send from your inbox.
      section.space-y-3
        h2.text-xl.font-semibold.text-slate-900 Capture
        p.text-slate-700 Use the camera or gallery on Home → Capture. Card photos and contact screenshots both work; we infer the source automatically.
      section.space-y-3
        h2.text-xl.font-semibold.text-slate-900 Follow-ups
        p.text-slate-700 After a scan we draft a short note. Open it in Gmail or Outlook, hit Send there, then tap “Yes, mark sent” so we stop nudging you.
      section.space-y-3
        h2.text-xl.font-semibold.text-slate-900 No email on the card?
        p.text-slate-700 Edit the contact, add an email, then open the draft again. Screenshots sometimes miss the address.
      section.space-y-3
        h2.text-xl.font-semibold.text-slate-900 Billing
        p.text-slate-700
          | Manage card and invoices from
          |
          router-link.text-emerald-700.font-medium(to="/subscription") Plans
          |  → Update card / invoices.
      section.space-y-3
        h2.text-xl.font-semibold.text-slate-900 Privacy & email prefs
        p.text-slate-700
          | Opt out of product emails or export/delete your data in
          |
          router-link.text-emerald-700.font-medium(to="/profile-setup#email-prefs") Profile & settings
          | .
      section.space-y-3
        h2.text-xl.font-semibold.text-slate-900 Still stuck?
        p.text-slate-700
          | Email
          |
          a.text-emerald-700.font-medium(href="mailto:support@billoai.com") support@billoai.com
</template>

<script setup>
</script>
