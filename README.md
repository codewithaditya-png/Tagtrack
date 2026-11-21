# TagTrack

A shopping watchlist for tracking prices across Amazon India, Flipkart, and Myntra. Compare recorded offers, set your own price targets, and keep product reviews in one place.

**[Open the live TagTrack demo](https://codewithaditya-png.github.io/Tagtrack/)**

## Run locally

Open `index.html` in a modern browser. There is no build step, account, or API key. Choose **Try sample data** to explore a fictional watchlist without changing your own.

## Use the watchlist

- **Add product** saves a name, target price, and the first store link and price.
- **Log price** records another offer for the same product. Use the exact same model, size, or variant across stores for a meaningful comparison. Saving again for the same store and date replaces that day's entry.
- The store list uses the latest dated entry for each store. **Target reached** appears when the cheapest of those entries meets the target.
- Choose **1 week**, **1 month**, **3 months**, **6 months**, **1 year**, or **All time** to filter chart entries. The range ends today. Expand **Full price log** to see all dates and correct any recorded price.
- **Compare stores** ranks the latest recorded offer from each store and shows how much more the other offers cost.
- **Write review** records a private star rating, pros, cons, and verdict.

Data stays in this browser when local storage is available. Storage behavior can vary when the app is opened directly as a local file. Prices are entered manually and TagTrack shows target hits on the dashboard. It does not check retailer prices in the background or send email alerts.

## Compare train fares

Use **Train fares** to log one-person quotes. Use the same station codes and travel date to group comparable trips. TagTrack sorts each journey by fare plus fees, displays the train and class, and highlights the lowest total. You can edit saved quotes. Quotes are entered manually and saved in the browser.

## Publish with GitHub Pages

Put `index.html`, `style.css`, `app.js`, and `README.md` in the repository root. Set the Pages source to **Deploy from a branch**, choose **main** and **/(root)**, and save.
