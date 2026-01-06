console.log("Starting screenshot service...");

const express = require("express");
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(express.json());

app.post("/screenshot", async (req, res) => {
  const { url } = req.body;

  if (!url) {
    console.log("ERROR: No URL provided in request body");
    return res.status(400).send("Missing url");
  }

  console.log("URL to screenshot:", url);

  let browser;
  try {
    // Launch a fresh Chromium instance per request
    console.log("Launching Chromium...");
    browser = await chromium.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--single-process"
      ]
    });
    console.log("Browser launched successfully");

    const page = await browser.newPage();
    console.log("New page created");

    console.log("Navigating to URL, waiting for network to be idle...");
    await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
    console.log("Page loaded successfully");

    // ✅ MOVED HERE — this is the ONLY change
    await page.waitForSelector(".db-loaded", { timeout: 12000 });

    console.log("Taking screenshot (540x750)...");
    const buffer = await page.screenshot({
      clip: { x: 0, y: 0, width: 540, height: 750 }
    });
    console.log("Screenshot captured, size:", buffer.length, "bytes");

    // Optional: save locally (Cloud Run filesystem is ephemeral)
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = path.join(__dirname, `screenshot-${timestamp}.png`);
    fs.writeFileSync(filename, buffer);
    console.log("Screenshot saved locally as:", filename);

    // Send screenshot back to client
    res.set("Content-Type", "image/png");
    res.send(buffer);
    console.log("Response sent successfully");

    await page.close();
    await browser.close();
    console.log("Browser closed, request complete\n");
  } catch (error) {
    if (browser) {
      try {
        await browser.close();
      } catch {}
    }
    console.error("ERROR during screenshot process:", error.stack || error);
    res.status(500).send("Failed to take screenshot");
  }
});

// Use process.env.PORT for Cloud Run
const PORT = process.env.PORT || 8080;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Screenshot API running on port ${PORT}, accessible externally`);
});
