import type { WritingCharacter } from "@/lib/writing/types";
import LanguageAudio from "@/components/learning/LanguageAudio";
import styles from "./WritingStudio.module.css";

const sentences: Record<string, { text: string; reading: string; translation: string }> = {
  あさ: { text: "あさに おきます。", reading: "Asa ni okimasu.", translation: "I wake up in the morning." },
  いぬ: { text: "いぬが います。", reading: "Inu ga imasu.", translation: "There is a dog." },
  うみ: { text: "うみに いきます。", reading: "Umi ni ikimasu.", translation: "I go to the sea." },
  えき: { text: "えきは どこですか。", reading: "Eki wa doko desu ka.", translation: "Where is the station?" },
  かさ: { text: "かさを もっています。", reading: "Kasa o motte imasu.", translation: "I have an umbrella." },
  ねこ: { text: "ねこが います。", reading: "Neko ga imasu.", translation: "There is a cat." },
  すし: { text: "すしを たべます。", reading: "Sushi o tabemasu.", translation: "I eat sushi." },
  みみ: { text: "みみで ききます。", reading: "Mimi de kikimasu.", translation: "We listen with our ears." },
  りんご: { text: "りんごを たべます。", reading: "Ringo o tabemasu.", translation: "I eat an apple." },
  アイス: { text: "アイスを たべます。", reading: "Aisu o tabemasu.", translation: "I eat ice cream." },
  カメラ: { text: "これは カメラです。", reading: "Kore wa kamera desu.", translation: "This is a camera." },
  コーヒー: { text: "コーヒーを のみます。", reading: "Kōhī o nomimasu.", translation: "I drink coffee." },
  パン: { text: "パンを たべます。", reading: "Pan o tabemasu.", translation: "I eat bread." },
};

function Highlight({ text, target }: { text: string; target: string }) {
  if (!target) return <>{text}</>;
  return <>{text.split(target).map((part, index) => <span key={index}>{index > 0 && <mark className={styles.characterHighlight}>{target}</mark>}{part}</span>)}</>;
}

export default function CharacterContext({ character, languageCode, systemSlug }: { character: WritingCharacter; languageCode: string; systemSlug?: string }) {
  const japanese = languageCode === "ja";
  const kanji = japanese && systemSlug === "kanji";
  const katakana = japanese && systemSlug === "katakana";
  const word = character.example_word;
  const sentence = japanese && word ? sentences[word] : undefined;
  const purpose = kanji
    ? "Kanji carries meaning. It can form a word on its own or combine with other characters. Its reading can change with the word, so learn it together with an example."
    : japanese
      ? katakana
        ? "Katakana writes sounds, especially in borrowed words, foreign names, and sound effects. This character is a building block: combine it with others to spell a word."
        : "Hiragana writes sounds. Use it to spell Japanese words, grammatical endings, and particles. A character usually represents a sound rather than an English meaning on its own."
      : "Use this character as a building block when reading and writing. Practice its sound in the example word; pronunciation can depend on the surrounding letters.";
  const special: Record<string, string> = {
    は: "In words, は is read ha. As the topic particle in a sentence, it is pronounced wa.",
    へ: "In words, へ is read he. As a particle marking direction, it is pronounced e.",
    を: "を is normally used as a particle marking the object of an action. It is pronounced o, as in みずを のみます (I drink water).",
    ん: "ん is a nasal sound. It follows another sound and does not normally start a Japanese word.",
    っ: "Small っ adds a short pause before the next consonant. It is different from full-size つ (tsu).",
    ー: "This mark lengthens the vowel before it. It does not have a separate sound of its own.",
  };
  return <div className={styles.contextGrid}>
    <section className={styles.purposeCard}><span className={styles.contextLabel}>What it is for</span><h2>{kanji ? "A character with meaning" : "From sound to words"}</h2><p>{purpose}</p>{japanese && special[character.character] && <p className={styles.usageTip}>{special[character.character]}</p>}{word && <div className={styles.wordBreakdown}><span lang={languageCode}><Highlight text={word} target={character.character} /></span><p>{character.example_translation}</p><small>{kanji ? "Notice how the character contributes to this word." : "The highlighted part shows where this character appears."}</small></div>}</section>
    <section className={styles.sentenceCard}><span className={styles.contextLabel}>{sentence ? "In a sentence" : "Read it in context"}</span><h2>{sentence ? "See how the word is used" : "Connect the character to a word"}</h2>{sentence ? <><p className={styles.contextJapanese} lang="ja"><Highlight text={sentence.text} target={character.character} /></p><p>{sentence.reading}</p><p>{sentence.translation}</p><LanguageAudio compact languageCode="ja" text={sentence.text} /><small>Spaces separate word groups here to help you read.</small></> : <><p>{word ? `Read ${word} as a whole, then find ${character.character} inside it. Listen and repeat before you try writing.` : `Listen to ${character.character}, then say it aloud before you write. Look for it in words as you continue learning.`}</p><div className={styles.usageTip}><strong>Try it aloud</strong><p>Look at the character → say its sound → read the whole example.</p></div></>}</section>
  </div>;
}
