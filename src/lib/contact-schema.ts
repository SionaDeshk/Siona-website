import { z } from "zod";

export const contactSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name (at least 2 characters).").max(100, "Please use 100 characters or fewer.").refine(value => !/[\r\n\u0000]/.test(value), "Please enter a valid name."),
  email: z.string().trim().max(254, "Please enter a shorter email address.").pipe(z.email("Please enter a valid email address.")),
  message: z.string().trim().min(10, "Please write at least 10 characters.").max(5000, "Please use 5,000 characters or fewer.").refine(value => !value.includes("\u0000"), "Please enter a valid message."),
});

export type ContactFields = z.infer<typeof contactSchema>;
export type ContactErrors = Partial<Record<keyof ContactFields, string>>;
