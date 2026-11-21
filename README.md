# TagTrack

A shopping watchlist for tracking prices across Amazon India, Flipkart, and Myntra. Compare recorded offers, set your own price targets, and keep product reviews in one place.

## Run locally

Open `index.html` in a modern browser. There is no build step, account, or API key. Choose **Try sample data** to explore a fictional watchlist without changing your own.

## Use the watchlist

- **Add product** saves a name, target price, and the first store link and price.
- **Log price** records another offer for the same product. Use the exact same model, size, or variant across stores for a meaningful comparison. Saving again for the same store and date replaces that day's entry.
- The store list uses the latest dated entry for each store. **Target reached** appears when the cheapest of those entries meets the target.
- The chart shows manually logged price history by store. Expand **Price log** to read the exact amounts and dates.
- **Write review** records a private star rating, pros, cons, and verdict.

Data stays in this browser when local storage is available. Storage behavior can vary when the app is opened directly as a local file. Prices are entered manually and TagTrack shows target hits on the dashboard. It does not check retailer prices in the background or send email alerts.

## Publish with GitHub Pages

Put `index.html`, `style.css`, `app.js`, and `README.md` in the repository root. Set the Pages source to **Deploy from a branch**, choose **main** and **/(root)**, and save.
