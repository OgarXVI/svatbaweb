# svatbaweb

Wedding website for JD & JC — a static multi-page HTML/CSS site.

## Pages

- `index.html` — landing page
- `obrad.html` — ceremony (place & time, directions, parking)
- `hostina.html` — reception (place & time, accommodation, parking)
- `harmonogram.html` — schedule
- `ostatni.html` — other information
- `prihlaska.html` — RSVP form
- `hra.html` — cat-catching mini game (`src/scripts/hra.js`, canvas, mobile friendly)

## Development

Styles live in `src/styles/style.css`. TypeScript sources (if any) are compiled with:

```bash
npm run build
```

No dev server is required — open any `.html` file directly in a browser.

## RSVP form (PHP + MySQL)

The "Formulář" page (`prihlaska.html`) posts to `api/prihlaska.php`, which inserts into the `prihlasky` table. Production needs PHP with PDO MySQL.

1. In phpMyAdmin, create a database and run `api/schema.sql` in it.
2. On the server, copy `api/config.sample.php` to `api/config.php` and fill in the DB credentials (`config.php` is git-ignored).
3. Submit the form; rows appear in the `prihlasky` table.

## Game leaderboard

`hra.html` saves scores through `api/skore.php` (`POST` stores a name and score, `GET` returns the top 10) into the `skore` table. Run the updated `api/schema.sql` to create it; it uses the same `api/config.php` as the RSVP form.
