import { Stripe } from 'stripe'
import { v4 as uuidv4 } from 'uuid'

let stripe = new Stripe("sk_test_51OMOYiE4GJiGICjc88otgbL3uHxypqwyYYS3wxPdh83He2Qj76wGGlED6b53URc8yHMtV97fkbhQS5zZuFAFQYkU00lG9t7Yho")


export const stripeCheckout = async (productDetails: any, userId: string, promotionId: string, totalAmount: number) => {
    const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: productDetails,
        mode: "payment",
        client_reference_id: userId,
        success_url: `http://localhost:5173/campaigns`,
        cancel_url: `http://localhost:5173/`,
        payment_intent_data: {
            metadata: {
                promotionId,
                totalAmount
            }
        }
    })

    const paymentIntent = await stripe.paymentIntents.create({
        amount: session.amount_total,
        currency: session.currency,
        payment_method_types: ['card'], // Adjust as needed
        metadata: {
          checkout_session_id: session.id,
        },
      });

    console.log(session.id, paymentIntent.client_secret)
    return { id: session.id, clientSecret: session.client_secret }
}

export default stripe