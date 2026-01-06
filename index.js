app.post("/screenshot", async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).send("Missing url");

  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage"
      ]
    });

    const page = await browser.newPage();

    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 60000
    });

    // ✅ WAIT HERE — this is the correct place
    await page.waitForSelector(".db-loaded", { timeout: 12000 });

    const buffer = await page.screenshot({
      clip: { x: 0, y: 0, width: 540, height: 750 }
    });

    res.set("Content-Type", "image/png");
    res.send(buffer);

    await page.close();
    await browser.close();
  } catch (err) {
    if (browser) await browser.close().catch(() => {});
    console.error(err);
    res.status(500).send("Failed to take screenshot");
  }
});
