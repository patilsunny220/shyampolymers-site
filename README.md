# Shyam Polymers website (sample)

A one-page static website for Shyam Polymers (shyampolymers.net). No build step, no framework: plain HTML, CSS and JavaScript.

## Preview

- Double-click `index.html`, or
- From `D:\New folder`, run `python -m http.server 5173 --directory shyampolymers-site` and open http://localhost:5173

## Files

| Path | What it is |
|---|---|
| `index.html` | The whole site: hero, numbers, acetate, colour range, Nylon & PBT, quality, sustainability, company, contact |
| `css/styles.css` | All styles. Colours and fonts are set at the top as variables |
| `js/particles.js` | Hero particle slider: granules form the wordmark, then a spectacle frame |
| `js/granules.js` | Draws the granule images: colour swatches, the granule photo stand-in, the havana strip |
| `js/main.js` | Menu, colour tabs, sticky header, contact form |
| `brochure/brochure.html` | Source of the 4-page A4 brochure |
| `downloads/shyam-polymers-brochure.pdf` | The brochure PDF linked from the site |
| `favicon.svg` | Browser tab icon (a havana granule) |

## Sample content to confirm before launch

Everything below is a placeholder or an assumption. Search `index.html` for `SAMPLE` to find the marked blocks.

- **Numbers:** 50+ years, 100 t acetate a year, 250+ people, 4 sites, 120+ colours, Nylon 6 50 t, PBT 30 t
- **Timeline:** all decades and events (only "2003, Shyam Polymers registered" comes from the IndiaMART listing)
- **Sites:** Halol, Waghodia and Savli plants are invented; the Ajwa Road head office is from IndiaMART/TradeIndia
- **Colour codes and names:** SP-A101 to SP-A421, and the Nylon/PBT grade codes
- **Typical properties and moulding guide:** every figure is a typical value for cellulose acetate, not their lab data
- **Certificates:** ISO 9001, REACH, RoHS, phthalate-free, ISO 14855 biodegradation. Only publish what they can show a certificate or report for
- **Raw materials:** "Europe and the USA"
- **Contact:** phone is `+91 265 XXX XXXX`; email `sales@shyampolymers.net` needs to be created; pincode 390019 is assumed
- **Claims:** "stock ships within a week", "custom colours in 7 to 10 working days", "reply within one working day", "sprue take-back"
- **Photos:** the four "Photo slot" tiles in Our sites wait for a photo day

## Swapping in the real logo

In `js/particles.js`, set `LOGO_SRC` to the logo file (a PNG with a transparent background works best), e.g. `var LOGO_SRC = "images/logo.png";`. The particles will form the logo instead of the typed wordmark. The header and footer use the typed wordmark in the Marcellus font; replace `.wordmark` text with an `<img>` if needed.

## Contact form

Out of the box, **Send request** opens the visitor's email app with the request filled in, addressed to `sales@shyampolymers.net`.

To receive enquiries straight to the inbox instead, create a free form endpoint (Web3Forms or Formspree), then put its URL in `data-endpoint` on the `<form id="enquiry">` in `index.html`. The script posts JSON to it and shows a thank-you message.

## Updating the brochure

Edit `brochure/brochure.html`, serve the site locally, and print it to PDF with Chrome or Edge (A4, margins none, background graphics on). Save over `downloads/shyam-polymers-brochure.pdf`.

## Going live

1. Upload the `shyampolymers-site` folder to a static host: Netlify, Cloudflare Pages or Vercel (all free for a site this size). Netlify and Cloudflare accept a drag-and-drop of the folder.
2. In Squarespace Domains (where shyampolymers.net is registered), point the domain's DNS to the host, following the host's "custom domain" steps.
3. Set up business email (e.g. sales@shyampolymers.net) with Zoho Mail or Google Workspace.
4. Create a Google Business Profile for the head office, and add the website link to the IndiaMART and TradeIndia listings.
