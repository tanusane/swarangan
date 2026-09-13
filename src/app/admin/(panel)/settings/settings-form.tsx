"use client";

import { Loader2, Save } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Field, TextArea, TextInput, Toggle } from "@/components/ui/field";
import type { SettingsToggle, SiteSettings } from "@/lib/cms/settings";

import { useAction } from "../content/collection-editor";

import { saveSettings } from "./actions";

type TextKey = Exclude<keyof SiteSettings, SettingsToggle>;

interface Group {
  title: string;
  toggles?: { name: SettingsToggle; label: string; hint?: string }[];
  fields?: { name: TextKey; label: string; long?: boolean; hint?: string }[];
}

/** The form, grouped as a person thinks about it. Every setting appears once. */
const GROUPS: Group[] = [
  {
    title: "Contact",
    toggles: [
      {
        name: "showPhone",
        label: "Show the phone number on the website",
        hint: "Header, footer and contact page.",
      },
      {
        name: "showWhatsApp",
        label: "Show WhatsApp buttons on the website",
        hint: "Header, footer, contact and classes pages, and the floating button on phones.",
      },
    ],
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
    toggles: [
      {
        name: "showYouTube",
        label: "Show the YouTube section on Social Presence",
      },
      {
        name: "showInstagram",
        label: "Show the Instagram section on Social Presence",
      },
      {
        name: "showFacebook",
        label: "Show the Facebook section on Social Presence",
        hint: "Includes a live preview of the Facebook page.",
      },
    ],
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
  const [values, setValues] = useState<SiteSettings>(initial);
  const [saved, setSaved] = useState(false);
  const { run, busy, error, fieldErrors } = useAction();

  function set<K extends keyof SiteSettings>(name: K, value: SiteSettings[K]) {
    setSaved(false);
    setValues((current) => ({ ...current, [name]: value }));
  }

  return (
    <form
      className="space-y-8"
      onSubmit={(event) => {
        event.preventDefault();
        setSaved(false);
        run(
          () => saveSettings({ ...values }),
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

          {group.toggles && (
            <div className="border-sand-200 space-y-3 border-b pb-5 md:col-span-2">
              {group.toggles.map((toggle) => (
                <Toggle
                  key={toggle.name}
                  label={toggle.label}
                  hint={toggle.hint}
                  checked={values[toggle.name]}
                  onChange={(checked) => set(toggle.name, checked)}
                />
              ))}
            </div>
          )}

          {group.fields?.map((field) => (
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
                  ) => set(field.name, event.target.value as never),
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
          {busy ? "Saving…" : "Save settings"}
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
