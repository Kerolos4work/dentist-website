# Sources for website copy and images

Checked 25 November 2026. The V1 site and the `/v3` one-pager use only facts confirmed by the five public sources supplied by the user, plus images downloaded from the doctor's public Instagram account. Unverified claims from the original mockup were removed.

## Source links

1. Instagram — https://www.instagram.com/dr.adelyousry/
2. Facebook — https://www.facebook.com/p/Dr-Adel-Yousry-61563860608616/
3. Google Maps — https://www.google.com/maps/place/Dr+Adel+Yousry+%7C+%D8%AF.%D8%B9%D8%A7%D8%AF%D9%84+%D9%8A%D8%B3%D8%B1%D9%8A%E2%80%AD/@30.1007519,31.3424207,17z/data=!3m1!4b1!4m6!3m5!1s0x1458150e2e98c113:0x88b184d1300b38d4!8m2!3d30.1007519!4d31.3424207!16s%2Fg%2F11h1m5c3w2?entry=ttu&g_ep=EgoyMDI2MTEyMi4wIKXMDSoASAFQAw%3D%3D
4. Yellow Pages — https://yellowpages.com.eg/en/map-category/dentist-clinics/11/p14/l%D8%AF
   - Profile reached from the listing: https://yellowpages.com.eg/en/profile/dr.-adel-yousry-el-sammanoudy/586900
5. Vezeeta — https://www.vezeeta.com/en/dr/Doctor-Adel-yosery-abd-elaziz-Dentistry

## Facts confirmed from those sources

### Instagram
- Handle: `@dr.adelyousry`; name shown as `Dr.Adel Yousry`.
- `411` followers, `8` following.
- Bio: “Dental Cosmetic Specialist — Creating timeless, radiant smiles. Expertise in veneers and smile transformation.”
- Highlights: `Smiles`, `Clinic`, `Veneers`, `whitening`, `B & A`.
- Profile link points to the Google Maps short link `maps.app.goo.gl/uApia9CrEWiX76w97`.
- Public posts supplied the before/after and procedure imagery used in the case, service, and Instagram sections. Some images contain embedded English marketing text, so they are used as case imagery rather than as clean hero art.

### Facebook
- The public page exposes only the name `Dr. Adel Yousry`.
- No Facebook-specific follower count, rating, or contact detail is asserted on the site.

### Google Maps
- Place name: `Dr Adel Yousry | د. عادل يسري`.
- Coordinates: `30.1007519, 31.3424207`; these power the embedded map and directions links.
- Rating shown during verification: `5.0` from `100` reviews.
- “Open · Closes 11 PM” was observed earlier, but opening hours change; the site uses `المواعيد تُؤكَّد عند الحجز` and links to Maps for current hours.

### Yellow Pages
- Listing: `Dr. Adel Yousry El Sammanoudy` / `Triumph Royal Dental Clinic`.
- Address: `60 Nakhla El Motaey St., Flat 1, Floor 1, Triumph Square, Heliopolis, Cairo`, above Florina Shop.
- The Arabic address in `react-app/data/site.ts` follows this listing.

### Vezeeta
- Doctor: `Doctor Adel yosery abd elaziz`; specialty: Dentistry.
- Specialist in cosmetic dentistry, root canal treatment, and oral & dental surgery.
- Eight listed specialties: Endodontics, Cosmetic Dentistry, Implantology, Periodontics, Prosthodontics, Oral Radiology, Pediatric Dentistry, Orthodontics.
- Credentials: member of the American Society of Cosmetic Dentistry (Wisconsin, USA) and the Egyptian Association for Dental and Laser Implantation.
- Examination fee: `300 EGP` / `300 ج.م`; waiting time: `31 Minutes`; online payment accepted.
- Location: Heliopolis, Triumph Square.
- Patient reviews quoted on the site are from Vezeeta and Google profile data.

## Rating conflict note

Vezeeta's rendered FAQ and structured data present `5.0` from `226` visitors, which is the value used in `react-app/data/site.ts`. The same fetched page text also contains the raw string `4.9226Overall Rating From 226 Visitors`. This is a source-text conflict, not a reason to revert to the old mockup's `4.9/5` claim. The site reports `5.0 / 226` and `SOURCES.md` records the discrepancy explicitly.

## Image provenance

The doctor portrait (`assets/dr-adel-yousry.jpg` / `.png`) and logo were supplied with the project. Instagram images were saved locally from public posts so the site does not depend on expiring CDN links.

| Local file | Source post |
| --- | --- |
| `react-app/public/assets/new/ig-full-arch.jpg` | https://www.instagram.com/dr.adelyousry/p/DaihyTlDvOa/ |
| `react-app/public/assets/new/ig-smile-close.jpg` | https://www.instagram.com/dr.adelyousry/p/DaIx2FljeN4/ |
| `react-app/public/assets/new/ig-veneers-detail.jpg` | https://www.instagram.com/dr.adelyousry/p/DZ2wS02jzer/ |
| `react-app/public/assets/new/ig-smile-shape.jpg` | https://www.instagram.com/dr.adelyousry/p/DZxmsYqjZW2/ |
| `react-app/public/assets/new/ig-smile-line.jpg` | https://www.instagram.com/dr.adelyousry/p/DZsdLsSiZo_/ |
| `react-app/public/assets/new/ig-smile-architecture.jpg` | https://www.instagram.com/dr.adelyousry/p/DZnTmTUmLw9/ |
| `react-app/public/assets/new/ig-transformation.jpg` | https://www.instagram.com/dr.adelyousry/p/DZX2wDODVd9/ |
| `react-app/public/assets/result-missing-teeth.jpg` | https://www.instagram.com/dr.adelyousry/p/DZsdLsSiZo_/ |
| `react-app/public/assets/result-smile-makeover.jpg` | https://www.instagram.com/dr.adelyousry/p/DYuqD-FDcoh/ |

Before/after images are published by the doctor on the public account and are presented with the existing patient-consent disclaimer. No new patient images are generated or invented.

## Deliberately omitted or cautiously worded

- Absolute “painless treatment” promises; review-supported comfort language is used instead.
- Fixed opening hours; current hours are delegated to Google Maps.
- Facebook-specific statistics; the page did not expose them.
- A separate WhatsApp number; the verified mobile `+20 12 85827427` is used for both calls and `wa.me`.
- Alternate phone numbers and hotlines from older third-party notes are no longer used as primary contact.
