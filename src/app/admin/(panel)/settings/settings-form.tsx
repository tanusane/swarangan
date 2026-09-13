"use client";

import { Loader2, Save } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Field, TextArea, TextInput } from "@/components/ui/field";
import type { SiteSettings } from "@/lib/cms/settings";

import { useAction } from "../content/collection-editor";

import { saveSettings } from "./actions";

type Key = keyof SiteSettings;

/** The form, grouped as a person thinks about it. Every setting appears once. */
const GROUPS: {
  title: string;
  fields: { name: Key; label: string; long?: boolean; hint?: string }[];
}[] = [
  {
    title: "Contact",
    fields: [
      {
        name: "phoneDisplay",
        label: "Phone (also used for WhatsApp)",
        hint: "With the country code, e.g. +65 8189 5399",
      },
      { name: "email", label: "Email" },
    ],
  },
  {
    title: "Studio address",
    fields: [
      { name: "street", label: "Street" },
      { name: "unit", label: "Unit" },
      { name: "building", label: "Building" },
      {
        name: "postalCode",
        label: "Postcode",
        hint: "Also moves the map and the directions link.",
      },
    ],
  },
  {
    title: "Social media",
    fields: [
      { name: "instagram", label: "Instagram link" },
      { name: "youtube", label: "YouTube link" },
      { name: "facebook", label: "Facebook link" },
    ],
  },
  {
    title: "Words used across the site",
    fields: [
      { name: "tagline", label: "Tagline (home page headline)" },
      {
        name: "description",
        label: "Short description (search results and link previews)",
        long: true,
      },
      { name: "quoteText", label: "Quote", long: true },
      { name: "quoteAttribution", label: "Quote by" },
      { name: "classesNote", label: "Note under the classes", long: true },
    ],
  },
];

export function SettingsForm({ initial }: { initial: SiteSettings }) {
  const [values, setValues] = useState<Record<Key, string>>(initial);
  const [saved, setSaved] = useState(false);
  const { run, busy, error, fieldErrors } = useAction();

  return (
    <form
      className="space-y-8"
      onSubmit={(event) => {
        event.preventDefault();
        setSaved(false);
        run(
          () => saveSettings(values),
          () => setSaved(true),
        );
      }}
    >
      {GROUPS.map((group) => (
        <fieldset
          key={group.title}
          className="border-sand-300 grid gap-4 rounded-(--radius-card) border bg-white p-6 md:grid-cols-2"
        >
          <legend className="px-2 text-lg text-blue-900">{group.title}</legend>
          {group.fields.map((field) => (
            <Field
              key={field.name}
              label={field.label}
              hint={field.hint}
              error={fieldErrors[field.name]}
              required
              className={field.long ? "md:col-span-2" : undefined}
            >
              {(control) => {
                const props = {
                  ...control,
                  value: values[field.name],
                  onChange: (
                    event: React.ChangeEvent<
                      HTMLInputElement | HTMLTextAreaElement
                    >,
                  ) => {
                    setSaved(false);
                    setValues((current) => ({
                      ...current,
                      [field.name]: event.target.value,
                    }));
                  },
                };
                return field.long ? (
                  <TextArea rows={3} {...props} />
                ) : (
                  <TextInput {...props} />
                );
              }}
            </Field>
          ))}
        </fieldset>
      ))}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={busy}>
          {busy ? (
            <Loader2 aria-hidden="true" className="size-4 animate-spin" />
          ) : (
            <Save aria-hidden="true" className="size-4" />
          )}
          Save settings
        </Button>
        {saved && (
          <p className="text-sm text-green-800">
            Saved. The website is updated.
          </p>
        )}
        {error && (
          <p role="alert" className="text-magenta-800 text-sm">
            {error}
          </p>
        )}
      </div>
    </form>
  );
}
