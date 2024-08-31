import { loadStripe } from '@stripe/stripe-js'

export const redirectToCheckout = async (sessionId: string) => {
    const stripePromise = loadStripe("pk_test_51OMOYiE4GJiGICjcO7ETml0xmXgcLyayr3PBHDGakHbbgObG1hECGcafKcrPq10zZq29dTEiCYN0KTKWlNZDccKm001MdZtqdZ")
    const stripe = await stripePromise
    stripe?.redirectToCheckout({
        sessionId,
    }).then((data) => {
        console.log(data)
    })
}