import type {
  ClassOffering,
  ContentBlock,
  LocationOption,
} from "@/content/types";

/**
 * Home page copy, VERBATIM from the legacy site, in the original order:
 *
 *   What is Hindustani Classical Music
 *   Hindustani Classical Music
 *   Guru Shishya Parampara
 *   Gharana
 *   -> class offerings
 *   Why Hindustani Classical Music
 *   -> locations
 *   Tanuja Sane (bio)
 *   -> quote, affiliations
 *
 * The brief was explicit that this sequence and this wording stay as they are.
 * Original spellings ("medival", "Aamir Khusrou", "Miya Tansen") are preserved
 * deliberately — they are Tanuja's words, not typos for us to silently fix.
 */

export const introBlocks: readonly ContentBlock[] = [
  {
    key: "what-is-hindustani-classical-music",
    eyebrow: "The tradition",
    title: "What is Hindustani Classical Music",
    body: [
      "The roots of the classical music of India are found in the Vedic literature and the ancient Natyashastra, the classic Sanskrit text on performing arts by Bharata Muni. Saamveda is perhaps the earliest literature which focuses on music and rules for music, mantra and chhanda.",
      "The Basis of any form of Indian classical music is Shruti, Swara, Raag and Taal.",
      "During the medieval period, Indian Music evolved into two distinct systems namely, The Carnatic (in the South) and The Hindustani (in the North).",
    ],
  },
  {
    key: "hindustani-classical-music",
    eyebrow: "Shastriya Sangeet",
    title: "Hindustani Classical Music",
    body: [
      "Hindustani classical music is the music of Northern regions of India and is also called as “Shastriya Sangeet.” Hindustani Music was greatly influenced by Persian and Mughal empires causing a considerable cultural interchange. Aamir Khusrou, Miya Tansen and later court musicians like Sadarang and Adarang have made major contributions to this form of music.",
      "In Hindustani classical music while performing a Raga the way the notes are approached and rendered in musical phrases and the mood they convey are more important than the notes themselves. This leaves ample scope for improvisation within the structured framework of the raga.",
      "The major vocal forms or styles associated with Hindustani classical music are Dhrupad, Khayal, and Tarana which adhere to the rigorous rules of classical music. Light classical forms include Dhamar, Thumri, Tappa, Kajri, Chaiti, Dadra, Ghazal and Bhajan which do not adhere to the rigorous rules of classical music.",
      "Indian Music evolved into two distinct systems during the medival period namely, The Carnatic (in the South) and The Hindustani (in the North).",
    ],
  },
  {
    key: "guru-shishya-parampara",
    eyebrow: "How it is passed on",
    title: "Guru Shishya Parampara",
    body: [
      "One of the most unique and exclusive features which is incorporated in the teaching of Indian Classical Music is the “Guru - Shishya” parampara (tradition). Throughout the history of Hindustani classical music, knowledge was passed down in the family by musically gifted members. Students or disciples moved into the home of their Gurus, which helped ensure the integrity of the knowledge transfer.",
    ],
  },
  {
    key: "gharana",
    eyebrow: "Lineage",
    title: "Gharana",
    body: [
      "The coinage “Gharana” came from the word “Ghar” (House). It is commonly observed that the gharanas are named after different places, Gwalior, Jaipur-Atrauli, Agra, Patiyala, Kirana, Rampur Bhendi bazar etc. The naming of these gharanas mostly indicates the origin of these particular musical styles or ideologies. Gharanas have their basis in the traditional mode of musical training and education. Every gharana has its own distinct features; the main area of difference between gharanas being the manner in which the notes are sung.",
    ],
  },
];

export const classOfferings: readonly ClassOffering[] = [
  {
    key: "beginner-children",
    title: "Beginner classes for children",
    audience: "children",
    description:
      "Upto 12 years, with focus on indian or hindustani classical vocal basics and children songs.",
  },
  {
    key: "advanced",
    title: "Advanced classes",
    audience: "advanced",
    description:
      "Depending on student's level of expertise. Previous basic training required.",
  },
  {
    key: "beginner-adults",
    title: "Beginner classes for Adults",
    audience: "adults",
    description:
      "Twelve years and above, covers indian classical vocal basics, semi-classical and light songs.",
  },
];

/** Shown beneath the class cards, exactly as on the legacy site. */
export const classesNote = "*Individual and group classes available.";

export const whyBlock: ContentBlock = {
  key: "why-hindustani-classical-music",
  eyebrow: "Why start here",
  title: "Why Hindustani Classical Music",
  body: [
    "Indian Classical music is widely considered to be a better foundation for any form of singing irrespective of regional language. With basic training in classical music, a student will be adept in mastering different styles of music including film songs, bhajans, ghazals or folk.",
  ],
};

export const locationOptions: readonly LocationOption[] = [
  {
    key: "at-class-location",
    title: "At class location",
    description: "West coast, Singapore",
    icon: "map-pin",
  },
  {
    key: "home-classes",
    title: "Home classes",
    description:
      "Classes available at your convenient location in Singapore. Please contact for more details",
    icon: "home",
  },
  {
    key: "online-classes",
    title: "Online classes",
    description:
      "Online classes available during any time zone. Please contact for more details.",
    icon: "monitor",
  },
];

export const teacherBlock: ContentBlock = {
  key: "tanuja-sane",
  eyebrow: "Your teacher",
  title: "Tanuja Sane M. A. Music",
  body: [
    "Tanuja Sane was inducted into music at an early age and was fortunate to receive her taleem under classical maestros Late Shri Wamanrao Sadolikar and Mrs. Manjiri Alegaonkar of Jaipur Atrauli Gharana. She started learning Gwalior Gayaki under the guidance of Mrs. Anuradha Garud. Her path of learning is now enlightened by Mrs. Apoorva Gokhale of Gwalior Gharana, helping her understand the nuances of performance-oriented gayaki.",
    "She has directed music programs and performed at many prestigious events in Singapore. She is a passionate music teacher and founder of the music institute Swarangan, Singapore - dedicated to promoting Hindustani vocal music in Singapore. She has more than 20 years of experience working with and teaching students.",
    "She holds a Master of Arts in Hindustani Vocal Music from Bharati Vidyapeeth - Pune, MBA in Human Resources, and B.E in Industrial Electronics",
  ],
};

export const quote = {
  text: "Music is the highest art and, to those who understand is the highest worship.",
  attribution: "Swami Vivekananda",
} as const;

/** Heading above the affiliation logos, as on the legacy site. */
export const examinationHeading = "Examination & Certification";
