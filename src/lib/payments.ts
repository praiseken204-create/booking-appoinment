/**
 * Pluggable payment provider architecture.
 *
 * To add a new provider:
 * 1. Add a PaymentProvider interface implementation.
 * 2. Register it in `paymentProviders`.
 * 3. Switch via PAYMENT_PROVIDER env var (mock | paystack | flutterwave).
 */

export type PaymentProviderName = "mock" | "paystack" | "flutterwave";

export interface PaymentInitializeParams {
  amount: number;
  currency: string;
  email: string;
  reference: string;
  metadata: Record<string, unknown>;
}

export interface PaymentInitializeResult {
  reference: string;
  paymentUrl: string | null;
}

export interface PaymentVerifyResult {
  paid: boolean;
  status: string;
  reference: string;
  metadata?: Record<string, unknown>;
}

export interface RefundParams {
  reference: string;
  amount?: number;
}

export interface RefundResult {
  refunded: boolean;
  reference: string;
}

export interface PaymentProvider {
  name: PaymentProviderName;
  initialize(params: PaymentInitializeParams): Promise<PaymentInitializeResult>;
  verify(reference: string): Promise<PaymentVerifyResult>;
  refund(params: RefundParams): Promise<RefundResult>;
}

// ---------------- MOCK PROVIDER ----------------

const mockProvider: PaymentProvider = {
  name: "mock",

  async initialize({ reference }) {
    // In mock mode, return a client-side "pay now" URL that users click.
    // The verify endpoint will auto-confirm.
    return { reference, paymentUrl: null };
  },

  async verify(reference) {
    // Mock: any valid reference is considered paid.
    return { paid: true, status: "success", reference };
  },

  async refund({ reference }) {
    return { refunded: true, reference };
  },
};

// ---------------- PAYSTACK PROVIDER ----------------

const paystackProvider: PaymentProvider = {
  name: "paystack",

  async initialize({ amount, currency, email, reference, metadata }) {
    const res = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: Math.round(amount * 100),
        currency,
        email,
        reference,
        metadata,
      }),
    });
    const data = await res.json();
    if (!data.status) throw new Error(data.message || "Paystack init failed");
    return { reference: data.data.reference, paymentUrl: data.data.authorization_url };
  },

  async verify(reference) {
    const res = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      { headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` } }
    );
    const data = await res.json();
    return {
      paid: data.status && data.data.status === "success",
      status: data.data?.status,
      reference,
      metadata: data.data?.metadata,
    };
  },

  async refund({ reference, amount }) {
    const res = await fetch("https://api.paystack.co/refund", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        transaction: reference,
        ...(amount ? { amount: Math.round(amount * 100) } : {}),
      }),
    });
    const data = await res.json();
    return { refunded: data.status, reference };
  },
};

// ---------------- FLUTTERWAVE PROVIDER ----------------

const flutterwaveProvider: PaymentProvider = {
  name: "flutterwave",

  async initialize({ amount, currency, email, reference, metadata }) {
    const res = await fetch("https://api.flutterwave.com/v3/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tx_ref: reference,
        amount: Number(amount.toFixed(2)),
        currency,
        redirect_url: metadata.redirect_url,
        customer: { email },
        customizations: {
          title: "BookAppoint",
          description: (metadata.description as string) || "Appointment payment",
        },
      }),
    });
    const data = await res.json();
    if (data.status !== "success") throw new Error("Flutterwave init failed");
    return { reference: data.data.tx_ref, paymentUrl: data.data.link };
  },

  async verify(reference) {
    // Flutterwave verify requires transaction id; for transactions where
    // we stored tx_ref, use /transactions/verify_by_reference
    const res = await fetch(
      `https://api.flutterwave.com/v3/transactions/verify_by_reference?tx_ref=${encodeURIComponent(reference)}`,
      { headers: { Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}` } }
    );
    const data = await res.json();
    const tx = data.data?.[0] || data.data;
    return {
      paid: data.status === "success" && tx?.status === "successful",
      status: tx?.status,
      reference,
      metadata: tx?.meta,
    };
  },

  async refund({ reference }) {
    const res = await fetch("https://api.flutterwave.com/v3/transactions/refunds", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ identifier: reference }),
    });
    const data = await res.json();
    return { refunded: data.status === "success", reference };
  },
};

// ---------------- REGISTRY ----------------

export const paymentProviders: Record<PaymentProviderName, PaymentProvider> = {
  mock: mockProvider,
  paystack: paystackProvider,
  flutterwave: flutterwaveProvider,
};

export function getPaymentProvider(): PaymentProvider {
  const name = (process.env.PAYMENT_PROVIDER as PaymentProviderName) || "mock";
  return paymentProviders[name] || paymentProviders.mock;
}
