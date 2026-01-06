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


const express = require("express");
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(express.json());

app.post("/screenshot", async (req, res) => {
  console.log("===== New Screenshot Request =====");
  console.log("Received request body:", req.body);

  const { url } = req.body;
  if (!url) {
    console.log("ERROR: No URL provided in request body");
    return res.status(400).send("Missing url");
  }

  console.log("URL to screenshot:", url);

  let browser;
  try {
    console.log("Launching Chromium browser...");
    browser = await chromium.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"]
    });
    console.log("Browser launched successfully");

    const page = await browser.newPage();
    console.log("New page created");

    console.log("Navigating to URL, waiting for network to be idle...");
    await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
    console.log("Page loaded successfully");

    console.log("Taking full-page screenshot...");
    const buffer = await page.screenshot({ fullPage: true });
    console.log("Screenshot captured, size:", buffer.length, "bytes");

    // Save screenshot locally with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = path.join(__dirname, `screenshot-${timestamp}.png`);
    fs.writeFileSync(filename, buffer);
    console.log("Screenshot saved locally as:", filename);

    console.log("Closing browser...");
    await browser.close();
    console.log("Browser closed");

    console.log("Sending screenshot back to client...");
    res.set("Content-Type", "image/png");
    res.send(buffer);
    console.log("Response sent successfully");
    console.log("===== Request Complete =====\n");
  } catch (error) {
    console.error("ERROR during screenshot process:", error);
    if (browser) await browser.close();
    res.status(500).send("Failed to take screenshot");
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Screenshot API running on port ${PORT}`);
});
