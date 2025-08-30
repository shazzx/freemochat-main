import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid'
import Stripe from 'stripe';
import { CHECKOUT_MODES, PAYMENT_METHOD_TYPES, PAYMENT_URLS } from 'src/utils/enums/global.c';

@Injectable()
export class PaymentService {
    private readonly stripe: Stripe
    constructor(private configService: ConfigService) {
        this.stripe = new Stripe(this.configService.get<string>('STRIPE_API_KEY'))
    }

    async stripeCheckout(productDetails: any, userId: string, promotionId: string, totalAmount: number, isApp: string) {
        const session = await this.stripe.checkout.sessions.create({
            payment_method_types: [PAYMENT_METHOD_TYPES.CARD],
            line_items: productDetails,
            mode: CHECKOUT_MODES.PAYMENT,
            client_reference_id: userId,
            success_url: PAYMENT_URLS.SUCCESS,
            cancel_url: PAYMENT_URLS.CANCEL,
            payment_intent_data: {
                metadata: {
                    promotionId,
                    totalAmount
                }
            }
        })

        if (Number(isApp) === 1) {
            await this.stripe.paymentIntents.create({
                amount: session.amount_total,
                currency: session.currency,
                payment_method_types: [PAYMENT_METHOD_TYPES.CARD],
                metadata: {
                    checkout_session_id: session.id,
                },
            });

            return { id: session.id, clientSecret: session.client_secret }
        }
        return session.id
    }

        async partialRefund(paymentIntentId: string, amount: number): Promise<Stripe.Refund> {
        try {
            const refund = await this.stripe.refunds.create({
                payment_intent: paymentIntentId,
                amount: amount,
            });
            return refund;
        } catch (error) {
            throw new Error(`Error processing refund: ${error.message}`);
        }
    }

}
