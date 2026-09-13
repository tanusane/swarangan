"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Loader2, Send } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Field, Select, TextArea, TextInput } from "@/components/ui/field";
import {
  CLASS_INTERESTS,
  CLASS_MODES,
  enquirySchema,
  type EnquiryInput,
} from "@/lib/enquiry-schema";
import { submitEnquiry } from "@/app/(site)/contact/actions";

/**
 * The enquiry form.
 *
 * Validation comes from the shared Zod schema, so the messages a visitor sees
 * are the same rules the server enforces. Submission goes through a Server
 * Action rather than a hand-rolled fetch, which means there is a single
 * auth-checked, validated write path.
 *
 * In Phase 1 the action stores nothing — it validates and returns. Phase 2
 * swaps its body for the Supabase insert plus the Resend notification, with no
 * change to this component.
 */
export function EnquiryForm() {
  const [sent, setSent] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EnquiryInput>({
    resolver: zodResolver(enquirySchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      interest: "",
      mode: "",
      message: "",
      botField: "",
    },
  });

  async function onSubmit(values: EnquiryInput) {
    setFormError(null);
    const result = await submitEnquiry(values);

    if (result.status === "success") {
      setSent(true);
      reset();
      return;
    }
    setFormError(result.message);
  }

  if (sent) {
    return (
      <div
        role="status"
        className="border-magenta-200 bg-magenta-50 rounded-(--radius-card) border p-8 text-center"
      >
        <span className="bg-magenta-600 mx-auto mb-4 inline-flex size-12 items-center justify-center rounded-full text-white">
          <Check aria-hidden="true" className="size-6" />
        </span>
        <h3 className="text-xl">Thank you — your message is on its way.</h3>
        <p className="text-ink-muted mt-3 text-sm">
          We will reply by email shortly. If it is urgent, WhatsApp is the
          fastest way to reach us.
        </p>
        <Button
          variant="secondary"
          className="mt-6"
          onClick={() => setSent(false)}
        >
          Send another message
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Your name" required error={errors.name?.message}>
          {(props) => (
            <TextInput
              {...props}
              {...register("name")}
              autoComplete="name"
              placeholder="e.g. Rachana Agarwal"
            />
          )}
        </Field>

        <Field label="Email" required error={errors.email?.message}>
          {(props) => (
            <TextInput
              {...props}
              {...register("email")}
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="you@example.com"
            />
          )}
        </Field>

        <Field
          label="Phone"
          hint="Optional — helpful if you would rather we call."
          error={errors.phone?.message}
        >
          {(props) => (
            <TextInput
              {...props}
              {...register("phone")}
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="+65 8123 4567"
            />
          )}
        </Field>

        <Field
          label="Which class interests you?"
          error={errors.interest?.message}
        >
          {(props) => (
            <Select {...props} {...register("interest")}>
              <option value="">Select one</option>
              {CLASS_INTERESTS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </Select>
          )}
        </Field>
      </div>

      <Field label="Preferred format" error={errors.mode?.message}>
        {(props) => (
          <Select {...props} {...register("mode")}>
            <option value="">Select one</option>
            {CLASS_MODES.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>
        )}
      </Field>

      <Field
        label="Message"
        required
        hint="Age of the student, any previous training, and when you would like to start."
        error={errors.message?.message}
      >
        {(props) => (
          <TextArea
            {...props}
            {...register("message")}
            rows={5}
            placeholder="I would like to enrol my daughter, who is 8 and has not learnt music before…"
          />
        )}
      </Field>

      {/* Honeypot. Hidden from people, irresistible to bots. Not `display:none`,
          which some bots detect — moved off-screen and taken out of the tab
          order and the accessibility tree instead. */}
      <div
        aria-hidden="true"
        className="absolute -left-[9999px] h-0 w-0 overflow-hidden"
      >
        <label htmlFor="botField">Leave this field empty</label>
        <input
          id="botField"
          tabIndex={-1}
          autoComplete="off"
          {...register("botField")}
        />
      </div>

      {formError && (
        <p role="alert" className="text-magenta-800 text-sm">
          {formError}
        </p>
      )}

      <Button type="submit" size="lg" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 aria-hidden="true" className="size-5 animate-spin" />
            Sending…
          </>
        ) : (
          <>
            <Send aria-hidden="true" className="size-5" />
            Send message
          </>
        )}
      </Button>

      <p className="text-ink-muted text-xs">
        We use your details only to reply to this enquiry.
      </p>
    </form>
  );
}
