import { Webhook } from "svix";
import Stripe from "stripe";
import User from "../models/User.js";
import { Purchase } from "../models/Purchase.js";
import { completePurchase } from "../utils/completePurchase.js";

// API controller to manage Clerk webhooks with database
export const clerkWebHooks = async (req, res) => {
  try {
    const whook = new Webhook(process.env.CLERK_WEBHOOK_SECRET);

    // express.raw() gives a Buffer; svix must verify the exact raw payload
    const payload = Buffer.isBuffer(req.body)
      ? req.body.toString("utf8")
      : JSON.stringify(req.body);

    whook.verify(payload, {
      "svix-id": req.headers["svix-id"],
      "svix-timestamp": req.headers["svix-timestamp"],
      "svix-signature": req.headers["svix-signature"],
    });

    const { data, type } = JSON.parse(payload);

    switch (type) {
      case "user.created": {
        const userData = {
          _id: data.id,
          email: data.email_addresses[0]?.email_address,
          name: `${data.first_name || ""} ${data.last_name || ""}`.trim(),
          imageUrl: data.image_url,
        };
        await User.create(userData);
        return res.json({ success: true });
      }

      case "user.updated": {
        const userData = {
          email: data.email_addresses[0]?.email_address,
          name: `${data.first_name || ""} ${data.last_name || ""}`.trim(),
          imageUrl: data.image_url,
        };
        await User.findByIdAndUpdate(data.id, userData);
        return res.json({ success: true });
      }

      case "user.deleted": {
        await User.findByIdAndDelete(data.id);
        return res.json({ success: true });
      }

      default:
        return res.json({ success: true });
    }
  } catch (error) {
    console.error("Clerk webhook error:", error);
    return res.status(400).json({ success: false, message: error.message });
  }
};

// Created lazily so the module can be imported before the env is populated
let stripeInstance = null
const getStripe = () => {
  if (!stripeInstance) {
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY)
  }
  return stripeInstance
}

// Look up the purchase behind a payment intent via its checkout session metadata
const findPurchaseByPaymentIntent = async (paymentIntentId) => {
  const sessions = await getStripe().checkout.sessions.list({
    payment_intent: paymentIntentId,
  })

  const purchaseId = sessions.data[0]?.metadata?.purchaseId
  if (!purchaseId) return null

  return Purchase.findById(purchaseId)
}

export const stripeWebhooks = async (request, response) => {
  const sig = request.headers["stripe-signature"]

  let event

  try {
    event = getStripe().webhooks.constructEvent(
      request.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    )
  } catch (err) {
    // Must return here: without a verified event there is nothing to handle
    return response.status(400).send(`Webhook Error: ${err.message}`)
  }

  try {
    switch (event.type) {
      case "payment_intent.succeeded": {
        const purchaseData = await findPurchaseByPaymentIntent(event.data.object.id)

        // completePurchase is idempotent, which matters because Stripe retries
        // webhooks and the checkout-return endpoint may have already run.
        await completePurchase(purchaseData)
        break
      }

      case "payment_intent.payment_failed": {
        const purchaseData = await findPurchaseByPaymentIntent(event.data.object.id)

        if (!purchaseData) break

        purchaseData.status = "failed"
        await purchaseData.save()
        break
      }

      default:
        console.log(`Unhandled event type ${event.type}`)
    }
  } catch (error) {
    console.error("Stripe webhook handler error:", error)
    return response.status(500).json({ received: false, message: error.message })
  }

  // Return a response to acknowledge receipt of the event
  response.json({ received: true })
}
