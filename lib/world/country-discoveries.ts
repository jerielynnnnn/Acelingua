import japan from "@/public/dashboard/japan.jpg";
import korea from "@/public/dashboard/korea.jpg";
import china from "@/public/dashboard/china.jpg";
import spain from "@/public/dashboard/spain.jpg";
import germany from "@/public/dashboard/germany.jpg";
import thailand from "@/public/dashboard/thai.jpg";
import france from "@/public/dashboard/france.jpg";
import type { StaticImageData } from "next/image";

export const countryDiscoveries: Record<string, { image: StaticImageData; history: string; trivia: string }> = {
  ja: {
    image: japan,
    history: "Kyoto served as Japan’s imperial capital for more than a thousand years. In 1868, the emperor moved to Tokyo, previously known as Edo, as Japan entered the Meiji era.",
    trivia: "Japanese uses three writing systems together: hiragana, katakana, and kanji. You can explore them in the Writing Studio!",
  },
  ko: {
    image: korea,
    history: "The Joseon dynasty ruled Korea from 1392 to 1910. During this era, King Sejong supported the creation of Hangul, giving people an alphabet designed for the Korean language.",
    trivia: "Hangul letters are arranged into syllable blocks. A block that looks like one character can contain several letters.",
  },
  zh: {
    image: china,
    history: "China’s history includes many successive dynasties, including the Han, Tang, Ming, and Qing. Imperial rule ended in 1912, following the revolution of 1911.",
    trivia: "Mandarin is a tonal language: changing the tone of a syllable can change its meaning.",
  },
  es: {
    image: spain,
    history: "Spain’s history reflects Roman rule and centuries of Muslim and Christian kingdoms. The marriage of Isabella of Castile and Ferdinand of Aragon in 1469 helped bring their kingdoms together.",
    trivia: "Spanish uses an opening question mark, ¿, as well as a closing one. Exclamations also have two marks: ¡ and !",
  },
  de: {
    image: germany,
    history: "For centuries, the lands of present-day Germany included many separate states. German unification took place in 1871; after division following World War II, Germany reunited in 1990.",
    trivia: "German capitalizes all nouns, so capital letters can help you spot them when reading.",
  },
  th: {
    image: thailand,
    history: "The kingdoms of Sukhothai and Ayutthaya were important centers in Thai history. Bangkok became the capital in 1782, and the country formerly known as Siam adopted the name Thailand in 1939.",
    trivia: "Thai is written with its own script and generally does not put spaces between individual words.",
  },
  fr: {
    image: france,
    history: "The French Revolution began in 1789 and transformed France’s monarchy and political life. Its ideas about citizenship and rights influenced societies far beyond France.",
    trivia: "French is spoken on several continents. Learning it can help you connect with communities well beyond France.",
  },
};
