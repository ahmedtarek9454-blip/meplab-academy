# Change Request — MEP LAB Player: Online Activation (v1)

> **ملخص بالعربي:** بدل ما الطالب ينسخ الـ Machine Code ويلزقه في الموقع وبعدين ينسخ كود التفعيل ويرجّعه، الـ Player هيعمل ده لوحده: الطالب يكتب إيميله وباسورده بتوع موقع MEP LAB، والبرنامج يجيب الرخص المربوطة بالجهاز ده ويفعّلها أوتوماتيك، ويعرض لينكات تحميل ملفات الكورسات. التفعيل اليدوي القديم يفضل شغّال زي ما هو.

**Target app:** MEP LAB Player (viewer), WPF / .NET
**Scope:** viewer only. The Publisher and the encryption format do **not** change.
**Server:** MEP LAB website (Next.js), already implemented: `POST /api/player/activate` and `POST /api/player/transfer`.

---

## 0. FIRST TASK — export the licence format (blocking for the website)

Before any UI work, create `docs/LICENSE_FORMAT.md` in the repo and fill it from the **actual code** (do not guess):

1. File paths and class/method names that **generate** activation codes (Publisher) and that **verify** them (Player).
2. Exact inputs: machine code (how it is produced and normalised: case, dashes, spaces), course/package ID, expiry, subscriber name/email (watermark), anything else.
3. Algorithm: hash/HMAC/RSA/ECDSA/AES…, key size, where the secret or private key lives, padding.
4. Output encoding: Base32/Base64/hex, alphabet, length, grouping (e.g. `XXXX-XXXX-…`).
5. Copy the generate + verify functions verbatim into the doc (code blocks).
6. Three test vectors: `(machine_code, course_id, expiry, …) → expected activation code`, produced by running the real code.

**Do not put the real secret/private key in the doc.** Write `<SECRET>` and say where it is stored.
This doc goes to the website so it can generate identical licences (`lib/license.ts`).

---

## 1. Settings

- `ActivationApiBaseUrl` in app config, default `https://<MEPLAB-SITE>`; overridable via config file.
- HTTPS only. Timeout 15 s. Header `User-Agent: MEPLAB-Player/<version>`.
- Use the **same machine code function** the Player already shows the user today.

## 2. API contract

### 2.1 `POST {base}/api/player/activate`

Request (JSON):
```json
{ "email": "student@mail.com", "password": "••••••", "machine_id": "<current machine code>", "app_version": "1.3.0" }
```

Success `200`:
```json
{
  "api": 1,
  "ok": true,
  "user": { "name": "Ahmed", "email": "student@mail.com" },
  "machine_id": "AAAA-1111-BBBB",
  "server_time": "2026-11-09T12:00:00.000Z",
  "enrollments": [
    {
      "order_id": "uuid",
      "status": "active",
      "license": "K7QD-M4XP-R2NW-8HJT-Y6CB-3VFA",
      "expires_at": "2027-11-09",
      "course": { "id": "uuid", "product_key": "HVAC01", "slug": "hvac-design-fundamentals",
                  "title_ar": "…", "title_en": "…", "download_url": "https://…/hvac.zip" }
    },
    { "order_id": "uuid", "status": "other_device", "device_hint": "…YYYY", "course": { … } },
    { "order_id": "uuid", "status": "transfer_pending", "device_hint": "…YYYY", "course": { … } },
    { "order_id": "uuid", "status": "pending", "course": { … } },
    { "order_id": "uuid", "status": "expired", "expires_at": "2026-10-01", "course": { … } }
  ]
}
```

`status` values:

| status | meaning | Player action |
|---|---|---|
| `active` | licence bound to THIS machine | install `license` exactly like manual activation; mark course unlocked |
| `other_device` | bought, but bound to another PC (`device_hint` = last 4 chars) | show **"Move licence to this PC"** button → 2.2 |
| `transfer_pending` | transfer already requested | show "Waiting for approval" (disabled) |
| `pending` | payment under review | show "Payment under review" |
| `expired` | subscription ended | show "Expired" + link to the website course page |

`product_key` is the ID that matches the course package (`.vdrm`) — use it to map licences to local packages.

Errors (JSON `{ "api":1, "ok":false, "error":"<code>" }`):

| HTTP | error | message to show (AR / EN) |
|---|---|---|
| 400 | `bad_request` | البيانات ناقصة / Missing data |
| 401 | `invalid_credentials` | الإيميل أو الباسورد غلط / Wrong email or password |
| 429 | `rate_limited` | محاولات كتير، استنى 10 دقايق / Too many attempts, wait 10 minutes |
| 500 | `server_error` / `server_not_configured` | مشكلة في السيرفر، جرّب بعدين / Server problem, try later |
| — | network/timeout | مفيش اتصال بالإنترنت / No internet connection |

### 2.2 `POST {base}/api/player/transfer`

Request:
```json
{ "email": "…", "password": "…", "machine_id": "<this PC>", "order_id": "<from 2.1>", "reason": "optional text" }
```
Success `200`: `{ "ok": true, "status": "transfer_pending" }` (calling twice is safe).
Errors: `404 not_found`, `409 already_on_this_device`, plus the ones above.
After the admin approves, the next call to 2.1 returns `active` with the new licence.

## 3. UI

New **"Sign in with MEP LAB account"** on the activation screen, **above** the existing manual code entry (keep manual entry as "Activate with a code").

1. **Sign-in dialog:** Email, Password (masked), checkbox "Remember my email", button "Sign in & activate", link "Create an account" → `{base}/signup`, link "Forgot password?" → `{base}/login`.
2. While calling: disable inputs, show spinner, allow Cancel.
3. **My courses list** (after success): one row per enrollment, showing title (AR/EN by app language) and a status chip. Actions by status:
   - `active` → "Activated ✓". If `download_url` exists and the package is not on disk, show **"Download files"**, which opens the URL in the default browser (no in-app download in v1).
   - `other_device` → "On another PC (…YYYY)" + **"Move licence to this PC"**, which opens a confirm dialog with an optional reason and then calls 2.2.
   - `transfer_pending` / `pending` / `expired` → as in the table above.
4. Button **"Refresh"** that re-calls 2.1. Re-prompt for the password and never reuse it.
5. Watermark: use `user.name` (or email) from the response for the per-subscriber watermark, the same way the manual flow does now.

## 4. Storage & security

- **Never store the password**, not even encrypted. Optionally store the email (DPAPI / user scope).
- Store received licences exactly where manual activation stores them today. Playback must stay **fully offline** after activation.
- Never log passwords or full licences. Mask licences in logs (`K7QD-****-…`).
- Licence verification stays local, with the same code as today. The server is only a delivery channel.

## 5. Acceptance tests

1. Wrong password shows the Arabic/English message, nothing changes locally.
2. Correct login on the bound PC unlocks `active` courses and playback works with the network unplugged afterwards.
3. Same account on a second PC shows `other_device`. Requesting a transfer shows `transfer_pending`. After the admin approves on the website, Refresh shows `active`.
4. `pending` and `expired` show correct chips, no licence installed.
5. 11 rapid failed logins show the rate-limit message.
6. Manual "Activate with a code" still works unchanged.
7. Base URL can be changed in config without rebuild.

## 6. Deliverables

- `docs/LICENSE_FORMAT.md` (section 0), **first**.
- Code + UI for sections 1–4, in its own branch/PR in the viewer repo, version bump (e.g. 1.3.1).
- Short note listing changed files.
