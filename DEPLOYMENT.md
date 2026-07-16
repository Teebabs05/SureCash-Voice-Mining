# Deploying to hostafrica.ng (cPanel + Node.js App)

This app is built with Next.js (a Node.js framework) and PostgreSQL. Your
cPanel host needs its **"Setup Node.js App"** feature and a **PostgreSQL**
database — both of which you've confirmed are available on your plan. You'll
do this over SSH, since a plain file upload isn't enough to actually *run* the
app (see the chat for why).

Wherever you see `yourdomain.com`, `USERNAME`, or similar placeholders, swap
in your real values.

---

## Phase 1 — Create the PostgreSQL database

1. Log into cPanel → find **PostgreSQL Databases**.
2. Create a new database, e.g. `USERNAME_surecash`.
3. Create a new database user with a strong password.
4. Add that user to the database with **ALL PRIVILEGES**.
5. Write down: database name, username, password. Your connection string
   will look like:

   ```
   postgresql://DBUSER:DBPASSWORD@localhost:5432/DBNAME?schema=public
   ```

   If `localhost:5432` doesn't work later, check the PostgreSQL Databases
   page (or ask hostafrica support) for the correct host/port — some cPanel
   setups run Postgres on a different port.

---

## Phase 2 — Create the Node.js App

1. In cPanel → find **Setup Node.js App** → **Create Application**.
2. **Node.js version**: pick the newest available (needs to be 20 or higher).
3. **Application mode**: Production.
4. **Application root**: a folder name, e.g. `surecash`.
5. **Application URL**: your domain (`yourdomain.com`), or a subdomain like
   `app.yourdomain.com` if you'd rather test first before going live on the
   main domain.
6. **Application startup file**: `server.js`
7. Click **Create**.

cPanel will show you a command to activate its "virtual environment" for
this app, something like:

```
source /home/USERNAME/nodevenv/surecash/20/bin/activate && cd /home/USERNAME/surecash
```

Copy that line somewhere — you'll run it every time before installing or
building.

---

## Phase 3 — Get the code onto the server

SSH into your server, then:

```bash
# clone into a temp folder first, since the app root cPanel made isn't empty
git clone -b claude/surecash-voice-mining-sk4up3 https://github.com/teebabs05/surecash-voice-mining.git /tmp/surecash-src
cp -r /tmp/surecash-src/. /home/USERNAME/surecash/
rm -rf /tmp/surecash-src
```

(Replace `/home/USERNAME/surecash` with your actual Application root from
Phase 2.)

---

## Phase 4 — Set environment variables

In cPanel's **Setup Node.js App** page, click into your app, and add these
under **Environment Variables**:

| Variable | Value |
|---|---|
| `DATABASE_URL` | `postgresql://DBUSER:DBPASSWORD@localhost:5432/DBNAME?schema=public` |
| `JWT_SECRET` | a random string (generate below) |
| `JWT_REFRESH_SECRET` | a *different* random string |
| `CREDENTIALS_ENCRYPTION_KEY` | a random 32-byte string (generate below) |
| `COOKIE_SECURE` | `true` |
| `NEXT_PUBLIC_APP_URL` | `https://yourdomain.com` |
| `APP_NAME` | `SureCash Mining` |

To generate the random values, SSH in and run this **three times**, using a
different output for each of `JWT_SECRET`, `JWT_REFRESH_SECRET`, and
`CREDENTIALS_ENCRYPTION_KEY`:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Keep `CREDENTIALS_ENCRYPTION_KEY` safe once set — losing it later would make
any payment-gateway keys you've saved in Admin Settings unreadable.

**Everything else is optional and can wait.** Paystack, bank transfer
providers, email, SMS, and WhatsApp do **not** need to go here — once the app
is live, log in as an admin and configure all of those from
**Admin → Settings**, where they're saved encrypted. The app runs fine
without them; it just falls back to logging things to its own console until
each one is configured.

---

## Phase 5 — Install, build, and set up the database

Back in SSH, activate the virtual environment from Phase 2, then:

```bash
cd /home/USERNAME/surecash
npm install
npx prisma generate
npx prisma migrate deploy
npm run build
```

If `npm run build` fails, paste me the error — some hosts need a memory
adjustment for the build step, which is easy to fix.

Do **not** run `npm run db:seed` — that creates fake demo users and test
data, meant only for development.

---

## Phase 6 — Start the app

1. Back in cPanel's **Setup Node.js App** page, click your app, then
   **Restart**.
2. Visit your domain — you should see the SureCash Mining welcome page.

---

## Phase 7 — Turn on HTTPS

1. In cPanel, find **SSL/TLS Status** (or **AutoSSL**) and run it for your
   domain if it isn't already on.
2. Once HTTPS is live, double check `NEXT_PUBLIC_APP_URL` is `https://` (not
   `http://`) and restart the app once more.

---

## Phase 8 — Make yourself the first admin

1. Register a normal account on the live site (your real email).
2. SSH in and run this once, with your real email swapped in:

   ```bash
   cd /home/USERNAME/surecash
   node -e "
   const { PrismaClient } = require('@prisma/client');
   const prisma = new PrismaClient();
   prisma.user.update({
     where: { email: 'you@yourdomain.com' },
     data: { role: 'SUPERADMIN', emailVerified: true }
   }).then((u) => { console.log('Promoted:', u.email, u.role); process.exit(0); });
   "
   ```
3. Log out and back in — you'll now see the Admin section. From
   **Admin → Settings**, configure your payment gateway(s) and any
   notification providers (email/SMS/WhatsApp) you want live.

---

## After launch: webhook URLs

For whichever payment gateway(s) you configure, set the webhook URL in that
gateway's own dashboard to:

```
https://yourdomain.com/api/webhooks/paystack       (or /monnify, /korapay, /payvessel, /flutterwave, /billstack)
```

---

## Redeploying later (after you make more changes)

```bash
cd /home/USERNAME/surecash
git pull origin claude/surecash-voice-mining-sk4up3
npm install
npx prisma generate
npx prisma migrate deploy
npm run build
```

Then restart the app from cPanel's Node.js App page.
