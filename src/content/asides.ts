/**
 * Margin panels for the home page's four introductory sections.
 *
 * Every item here is drawn from the section it sits beside, or from Tanuja's own
 * biography. Nothing is invented: the four foundations, the vocal forms and the
 * gharana names are all named in the legacy copy, and the lineage is the one
 * given in her bio. They exist to fill the empty right-hand column with
 * something worth reading rather than decoration.
 *
 * Devanagari is included where the term has a standard spelling, because these
 * are Sanskrit/Hindi words and the transliteration alone loses something.
 */

export interface AsideTerm {
  devanagari?: string;
  label: string;
  note?: string;
  /** Draws attention to the entries that apply to Swarangan specifically. */
  highlight?: boolean;
}

export interface AsideGroup {
  label: string;
  items: readonly string[];
}

export interface AsideLineageStep {
  name: string;
  note: string;
}

export type AsidePanel =
  | {
      kind: "terms";
      title: string;
      caption?: string;
      terms: readonly AsideTerm[];
    }
  | {
      kind: "groups";
      title: string;
      caption?: string;
      groups: readonly AsideGroup[];
    }
  | {
      kind: "lineage";
      title: string;
      caption?: string;
      steps: readonly AsideLineageStep[];
    };

/**
 * Keyed by the `ContentBlock.key` of the section each panel accompanies, so a
 * section without a panel simply renders full-width.
 */
export const sectionAsides: Readonly<Record<string, AsidePanel>> = {
  // "The Basis of any form of Indian classical music is Shruti, Swara, Raag
  // and Taal." — named in this section's own copy.
  "what-is-hindustani-classical-music": {
    kind: "terms",
    title: "The four foundations",
    caption: "Every raga rests on these.",
    terms: [
      {
        devanagari: "श्रुति",
        label: "Shruti",
        note: "The smallest audible difference in pitch — the microtone.",
      },
      {
        devanagari: "स्वर",
        label: "Swara",
        note: "A note, chosen and placed with intent.",
      },
      {
        devanagari: "राग",
        label: "Raag",
        note: "A melodic framework, and the mood it carries.",
      },
      {
        devanagari: "ताल",
        label: "Taal",
        note: "The cycle of beats the music moves within.",
      },
    ],
  },

  // The forms listed in this section's copy, kept in its two groupings.
  "hindustani-classical-music": {
    kind: "groups",
    title: "Vocal forms",
    caption: "What a Hindustani vocalist learns to sing.",
    groups: [
      {
        label: "Adhering to the rigorous rules",
        items: ["Dhrupad", "Khayal", "Tarana"],
      },
      {
        label: "Light classical",
        items: [
          "Dhamar",
          "Thumri",
          "Tappa",
          "Kajri",
          "Chaiti",
          "Dadra",
          "Ghazal",
          "Bhajan",
        ],
      },
    ],
  },

  // Tanuja's own taleem, exactly as given in her biography — the parampara
  // this section describes, made concrete.
  "guru-shishya-parampara": {
    kind: "lineage",
    title: "Tanuja's own taleem",
    caption: "The parampara, in practice.",
    steps: [
      {
        name: "Late Shri Wamanrao Sadolikar",
        note: "Jaipur Atrauli Gharana",
      },
      {
        name: "Mrs. Manjiri Alegaonkar",
        note: "Jaipur Atrauli Gharana",
      },
      {
        name: "Mrs. Anuradha Garud",
        note: "Gwalior gayaki",
      },
      {
        name: "Mrs. Apoorva Gokhale",
        note: "Gwalior Gharana — performance-oriented gayaki",
      },
    ],
  },

  // The gharanas named in this section, with the two Tanuja trained in marked.
  gharana: {
    kind: "terms",
    title: "Named after their places",
    caption: "The gharanas mentioned here.",
    terms: [
      { label: "Gwalior", note: "Tanuja's gayaki", highlight: true },
      {
        label: "Jaipur-Atrauli",
        note: "Tanuja's early taleem",
        highlight: true,
      },
      { label: "Agra" },
      { label: "Patiyala" },
      { label: "Kirana" },
      { label: "Rampur Bhendi bazar" },
    ],
  },
};
