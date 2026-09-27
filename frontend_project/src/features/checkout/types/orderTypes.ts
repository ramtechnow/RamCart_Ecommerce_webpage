import { z } from "zod";

// Zod schema for validating the checkout address
export const addressSchema = z.object({
  fullName: z.string()
    .min(3, "Full name must be at least 3 characters")
    .max(50, "Full name must not exceed 50 characters")
    .regex(/^[a-zA-Z\s]+$/, "Full name must contain only letters and spaces"),
  addressLine: z.string()
    .min(5, "Address must be at least 5 characters")
    .max(100, "Address must not exceed 100 characters"),
  city: z.string()
    .min(2, "City must be at least 2 characters")
    .max(50, "City must not exceed 50 characters"),
  state: z.string()
    .min(2, "State must be at least 2 characters")
    .max(50, "State must not exceed 50 characters"),
  postalCode: z.string()
    .min(5, "Postal code must be at least 5 characters")
    .max(10, "Postal code must not exceed 10 characters")
    .regex(/^\d+$/, "Postal code must contain only numbers"),
  phone: z.string()
    .min(10, "Phone number must be at least 10 digits")
    .max(15, "Phone number must not exceed 15 digits")
    .regex(/^\+?[0-9\s\-()]+$/, "Invalid phone number format")
});

// Zod schema for validating the simulated credit card details
export const paymentSchema = z.object({
  cardholderName: z.string()
    .min(3, "Cardholder name must be at least 3 characters")
    .max(50, "Cardholder name must not exceed 50 characters")
    .regex(/^[a-zA-Z\s]+$/, "Cardholder name must contain only letters and spaces"),
  cardNumber: z.string()
    .regex(/^\d{4} \d{4} \d{4} \d{4}$/, "Card number must be in '1234 5678 1234 5678' format"),
  expiryDate: z.string()
    .regex(/^(0[1-9]|1[0-2])\/\d{2}$/, "Expiry date must be in MM/YY format"),
  cvv: z.string()
    .regex(/^\d{3}$/, "CVV must be exactly 3 digits")
});

// Combined checkout validation schema
export const checkoutSchema = z.object({
  address: addressSchema,
  payment: paymentSchema
});

export type AddressValues = z.infer<typeof addressSchema>;
export type PaymentValues = z.infer<typeof paymentSchema>;
export type CheckoutValues = z.infer<typeof checkoutSchema>;

// Firestore Order Item Schema
export interface OrderItem {
  productId: string;
  name: string;
  image: string;
  size: string;
  color: string;
  quantity: number;
  price: number;
}

export interface Order {
  id?: string;
  userId: string;
  userEmail?: string;
  userName?: string;
  items: OrderItem[];
  amount: number;
  address: AddressValues;
  couponCode: string | null;
  status: "Pending" | "Processing" | "Shipped" | "Delivered" | "Cancelled";
  payment: boolean;
  cancelledAt?: any;
  cancellationReason?: string;
  createdAt: any; // Server timestamp or Date object
}
