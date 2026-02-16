/**
 * pages/PaymentPage.jsx — Re-export from features/payments (Clean Architecture).
 * Checkout flow uses paymentService (axiosClient) and redirects to Stripe Checkout.
 */
export { default } from "../features/payments/PaymentCheckout";
