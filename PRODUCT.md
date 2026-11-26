# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Prospective patients in Cairo, especially Heliopolis and Triumph Square, comparing dentists for cosmetic work, veneers, implants, root canal treatment, or a general check-up. They arrive from Instagram, Facebook, Google Maps, Yellow Pages, or Vezeeta and want enough proof to choose and book.

## Product Purpose

Present Dr. Adel Yousry's clinic truthfully, make the cosmetic-dentistry specialization legible, show real patient results and reviews, and make booking or calling immediate. Success is a visitor understanding the specialty, seeing credible proof, and booking through Vezeeta or contacting the clinic.

## Positioning

A cosmetic-dentistry practice whose proof is its own published case imagery and patient reviews from Google and Vezeeta, rather than generic dental marketing claims.

## Operating Context

Arabic RTL website with two standalone front ends: a multi-page V1 site with its own shared header/footer, and a V3 single-page site reached only by typing `/v3`. Patient booking, status, and role-based staff dashboards reuse the shared V1 header/nav bar with booking-specific links, while keeping a neutral appointment footer. Booking and discovery also happen through Google Maps, Vezeeta, Instagram, Facebook, phone, and WhatsApp.

## Capabilities and Constraints

- Existing routes `/`, `/services`, `/results`, `/about`, `/contact` remain unchanged.
- V1 and V3 each have exactly one navigation; V3 has no link back to V1 and no site links to `/v3`.
- V3 is an additional `/v3` one-pager with in-page anchors and its own footer; it does not replace V1.
- Next.js App Router, TypeScript, CSS Modules, scoped layout chrome, no `/header` or `/footer` routes.
- Appointment routes: `/appointments`, `/my-appointments`, `/dashboard`, `/dashboard/nurse`, `/dashboard/doctor`, `/dashboard/settings`.
- Only verified source facts and approved patient images may be used; no invented claims.
- Verified contact: `+20 12 85827427`; WhatsApp `wa.me/201285827427`.
- Verified exam fee: `300 ج.م` / `300 EGP`; waiting time `31 Minutes` on Vezeeta.
- Verified address: 60 Nakhla El Motaey St., Flat 1, Floor 1, Triumph Square, Heliopolis, Cairo, above Florina Shop.
- Verified ratings used on the site: Google `5.0` from `100` reviews; Vezeeta `5.0` from `226` visitors. The raw Vezeeta page also exposes `4.9226`, so the discrepancy is documented rather than hidden.
- Facebook page exposes only the name `Dr. Adel Yousry`; no Facebook-specific statistics may be invented.

## Brand Commitments

- Arabic RTL experience.
- Dark, red, and cyan palette.
- Cairo for Arabic UI, Anton for Latin display, Pinyon Script for the signature line.
- Clinic name: Triumph Royal Dental Clinic / تريومف رويال دنتال كلينك.
- Real Instagram before/after imagery and genuine patient reviews only.

## Evidence on Hand

- `react-app/data/site.ts`: verified services, cases, reviews, credentials, Instagram posts, links, and contact facts.
- `SOURCES.md`: source provenance for public facts and images.
- `react-app/public/assets/`: doctor portrait, logo, and downloaded Instagram case images.
- Public sources: Instagram `@dr.adelyousry`, Facebook page, Google Maps place, Yellow Pages listing, Vezeeta profile.
- Absence: no verified opening hours beyond “Open · Closes 11 PM” observed earlier on Google Maps and “ appointments confirmed at booking”; the site uses the cautious wording already in `site.ts`.

## Product Principles

- Proof before promises: show real reviews, ratings, and patient-approved results.
- One verified source of truth: reuse `site.ts` rather than duplicating facts.
- Clarity before action: explain the specialty, location, fee, and booking path plainly.
- Preserve the working V1 site while keeping a distinct V3 one-page experience that is deliberately unlinked.
- Appointment confirmation is authoritative only from verified payment webhooks or nurse action; the client never approves itself.
- Never turn an unverified marketing idea into a factual claim.

## Accessibility & Inclusion

Keyboard-reachable anchors and links, visible focus states, semantic sections, descriptive Arabic alt text, and no horizontal overflow at 390px mobile width.
