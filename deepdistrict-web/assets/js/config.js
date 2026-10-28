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
   ========================================================================== */
window.DD_CONFIG = {
  form: {
    endpoint: "",
    accessKey: "",
    timeoutMs: 12000
  }
};
