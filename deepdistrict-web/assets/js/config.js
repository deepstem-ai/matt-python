/* ==========================================================================
   DeepDistrict.si — site configuration (edit before going live)
   --------------------------------------------------------------------------
   CONTACT FORM
   Leave `endpoint` empty and the form opens the visitor's email app
   (mailto:) — nothing is sent by the website itself.
   To send messages straight to info@deepdistrict.si, set an endpoint that
   accepts a JSON POST, for example:
     • Web3Forms   endpoint: "https://api.web3forms.com/submit", accessKey: "<your key>"
     • Formspree   endpoint: "https://formspree.io/f/<form id>"
     • Your own server / serverless function
   Then update the privacy notice (pages/legal.html#privacy) to name the
   provider as a data processor. If sending fails, the form falls back to
   the email app automatically.

   STAFF CONTACT (shown in every course summary: "Contact our staff")
   Fill in a phone number and the LINE Official Account ID when you have them;
   empty values are simply not shown.
   ========================================================================== */
window.DD_CONFIG = {
  contact: {
    email: "info@deepdistrict.si",
    phone: "",          // e.g. "+66 81 234 5678"
    lineId: ""          // e.g. "@deepdistrict"
  },
  form: {
    endpoint: "",
    accessKey: "",
    timeoutMs: 12000
  }
};
