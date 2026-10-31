# Vendored libraries (MIT licence)

| File | Library | Version | Use |
| --- | --- | --- | --- |
| `html2canvas.min.js` | html2canvas | 1.4.1 | Render a report to a PNG image |
| `jspdf.umd.min.js` | jsPDF | 4.2.1 | Save a report as a PDF file |

Copied unmodified from the npm packages; licences are next to them. They are loaded only by
the back office (`admin/`), never by the public site.

## qrcode.js
QR Code Generator for JavaScript 1.4.4 by Kazuhiko Arase (MIT licence; the licence notice is at
the top of the file). Used for the verification QR code printed on audited PDFs.
"QR Code" is a registered trademark of DENSO WAVE INCORPORATED.
