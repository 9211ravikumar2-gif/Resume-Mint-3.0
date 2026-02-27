import { Express } from "express";
import Razorpay from "razorpay";
import puppeteer from "puppeteer";
import dotenv from "dotenv";

dotenv.config();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_placeholder",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "rzp_test_secret_placeholder",
});

export function registerRoutes(app: Express) {
  // Razorpay Create Order
  app.post("/api/create-order", async (req, res) => {
    try {
      const options = {
        amount: 49900, // Amount in paise (₹499)
        currency: "INR",
        receipt: `receipt_${Date.now()}`,
      };
      const order = await razorpay.orders.create(options);
      res.json(order);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Verify Payment (Simplified for test mode)
  app.post("/api/verify-payment", async (req, res) => {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;
    // In a real app, you'd verify the signature here.
    // For this demo/test mode, we'll assume success if we get the IDs.
    if (razorpay_payment_id && razorpay_order_id) {
      res.json({ status: "success" });
    } else {
      res.status(400).json({ status: "failed" });
    }
  });

  // PDF Generation Route
  app.post("/api/generate-pdf", async (req, res) => {
    try {
      const { html } = req.body;
      if (!html) return res.status(400).json({ error: "HTML content is required" });

      const browser = await puppeteer.launch({
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu'
        ],
        headless: true
      });
      const page = await browser.newPage();
      
      // Set content and wait for basic load
      await page.setContent(html, { waitUntil: 'load', timeout: 30000 });
      
      // Wait a bit for fonts to settle
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '0px', right: '0px', bottom: '0px', left: '0px' },
        preferCSSPageSize: true
      });

      await browser.close();

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=resume.pdf');
      res.send(pdf);
    } catch (error: any) {
      console.error("PDF Generation Error:", error);
      // If it's already sent headers, we can't send JSON
      if (!res.headersSent) {
        res.status(500).json({ error: "Failed to generate PDF: " + error.message });
      }
    }
  });
}
