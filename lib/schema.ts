import { z } from "zod";
import { COUNTRIES, PLANS, STATUSES, type AnalyticsData } from "./types";

export const customerSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  country: z.string(),
  plan: z.enum(PLANS),
  seats: z.number(),
  mrr: z.number(),
  status: z.enum(STATUSES),
  joined: z.string(),
});

/** Validates what /api/analytics returns. */
export const analyticsSchema: z.ZodType<AnalyticsData> = z.object({
  series: z.array(
    z.object({
      date: z.string(),
      revenue: z.number(),
      signups: z.number(),
      active: z.number(),
      churned: z.number(),
    }),
  ),
  customers: z.array(customerSchema),
});

/** Validates the add / edit customer form. */
export const customerFormSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(40, "Name is too long"),
  email: z.email("Enter a valid email address"),
  country: z.enum(COUNTRIES, "Pick a country"),
  plan: z.enum(PLANS),
  seats: z.number().int("Seats must be a whole number").min(1, "At least 1 seat").max(100, "At most 100 seats"),
  status: z.enum(STATUSES),
});

export type CustomerFormValues = z.infer<typeof customerFormSchema>;
