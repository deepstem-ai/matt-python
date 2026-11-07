# Plan: posting news from the DeepDistrict portal

Goal: write a piece of news **once** in the back office (Thai + English, image or video,
link), choose where it goes, preview it, then send it now or at a set time. Every send is kept
in a history with per-channel results.

## Summary — what is possible

| Channel | Possible from the portal? | Cost | What is needed | When |
| --- | --- | --- | --- | --- |
| Website news page | ✅ fully | free | nothing | phase 1 |
| In-app inbox (bell) | ✅ fully, already built for notifications | free | nothing | phase 1 |
| Email (everyone / a role / a course / chosen people) | ✅ fully | free with Gmail (≈ 500 recipients/day; Google Workspace ≈ 2,000) | Settings → Email (done) | phase 1 |
| LINE OA **broadcast** (all friends of the account) | ✅ via Messaging API | each recipient counts against the monthly quota (free ≈ 300) | LINE OA set up (done in 4.4) | phase 1 |
| **Specific LINE users** (chosen people / a course / parents only) | ✅ via push / multicast to linked users | each recipient counts | people connected their LINE (done in 4.4) | phase 1 |
| Facebook **Page** post (text, link, photo) | ✅ via Graph API, to your own Page | free | Meta developer app + Page token (`pages_manage_posts`) | phase 2 |
| Instagram (business account) | ✅ via Graph API, image/video required | free | Instagram professional account linked to the Page | phase 2 (optional) |
| TikTok | ⚠ only after TikTok approves the app; video/photos only | free | TikTok developer app + review/audit | phase 3; until then *share manually* |

## 1. Website, inbox and email — phase 1

- New page in the back office **News / ข่าวสาร**: title, text (TH/EN), cover image, optional link
  and video file, audience, channels, *Send now* or *Schedule*.
- **Audience**: everyone, a role (parents, students, teachers), a course, active enrolments only,
  or selected people.
- **Website**: published news appear on a public news page (optional per post).
- **Email**: sent in small batches by the existing notification worker; each email has an
  *unsubscribe from news* link. News is marketing, so under PDPA only people who agreed to
  receive news get it; lesson notifications stay separate.

## 2. LINE — phase 1

Uses the LINE Official Account already connected in 4.4.

- **Broadcast**: to every friend of the account, including people who never signed in to the
  portal. Can be a text, an image with text, or a card (Flex message) with a button that
  opens the news.
- **Specific people**: to chosen people, a course or parents only, through the LINE accounts
  linked with the 6-digit code (up to 500 people per request).
- **Quota**: with the free plan, *every recipient counts*. Example: a broadcast to 120 friends
  uses 120 of the ≈ 300 monthly messages, which leaves 180 for lesson notifications.
  - The portal shows the cost before sending (e.g. "this uses 120 of 172 left").
  - The portal can keep a reserve for lesson notifications.
  - If news is sent often, the paid plan is cheaper than missing notifications. In Thailand that
    is roughly 1,280 THB/month for 15,000 messages; check LINE's current price list.
- **Free alternative**: post the news on the LINE OA **timeline (VOOM)** or **chat tags**
  manually in the OA Manager app. This costs no messages, but LINE has no API for it.

## 3. Facebook Page — phase 2

- **How**: Graph API `POST /{page-id}/feed` (text + link) or `/{page-id}/photos` (photo + text).
- **Setup, once**:
  1. Create an app at developers.facebook.com.
  2. A Page admin logs in through the portal; this grants `pages_manage_posts` and
     `pages_read_engagement`.
  3. The portal stores a long-lived **Page access token** on the server. Like the LINE token, it
     is never shown again.
- **Review**: posting to *your own* Page by the app's own admins works without Meta App Review.
  App Review and Business Verification are only needed for other people's Pages or for public
  use. Meta changes these rules often, so check them when we build it.
- **Instagram** (optional) uses the same login. A business Instagram account linked to the Page
  can receive image/video posts.
- **Hosting**: PythonAnywhere free allows only listed sites, and `graph.facebook.com` must be
  reachable. If it is not, use the paid plan or post from the local computer.

## 4. TikTok — phase 3 (manual first)

- TikTok's **Content Posting API** needs a video (or photos) and a TikTok developer app.
  - Until TikTok **audits** the app, posts can only be **private (only me)**, and only a few
    accounts can use it.
  - Public posting needs approval, with a demo video of the portal and a privacy policy.
- **Recommended for now**: the News page makes a ready-to-post package (the vertical
  video/image, caption and hashtags in TH/EN). On a phone, press *Share → TikTok*, or download
  it and post it in the TikTok app. This takes 30 seconds and needs no approval.
- After the audit, a *Post to TikTok* button can send the video either as a **draft to the
  TikTok inbox** (finish in the app) or as a **direct post**.

## Order of work

1. **Phase 1, about 1 build round**:
   - News page and history
   - Audiences
   - Website, inbox, email
   - LINE broadcast and multicast, with a quota preview
   - The TikTok/Facebook share package (manual)
2. **Phase 2**: Facebook Page (and Instagram), once you have a Meta developer account and are
   an admin of the Page.
3. **Phase 3**: TikTok API, after TikTok approves the app; manual sharing until then.

## What you need to prepare

- **LINE**: the Messaging API channel token, secret and webhook. The steps are in
  `server/DEPLOY.md`.
- **Facebook**: a Meta developer account on a Facebook profile that is an admin of the
  DeepDistrict Page.
- **TikTok**: a TikTok business account, and later a TikTok developer account with a privacy
  policy URL (the site's `pages/legal.html`).
- **Decisions**:
  - who may send news (admins only?)
  - whether news needs a second person's approval
  - the PDPA consent wording for receiving news
