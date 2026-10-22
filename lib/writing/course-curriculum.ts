export type WritingBlock = { title: string; text: string; japanese?: string; korean?: string; reading?: string; translation?: string; segments?: { text: string; system: "hiragana" | "katakana" | "kanji" }[] };
export type WritingExercise = {
  slug: string; kind: "choice" | "word" | "sentence" | "character";
  prompt: string; explanation: string; answer: string; alternatives?: string[];
  choices?: string[]; tiles?: string[]; reading?: string; hint?: string;
  requiredParticle?: string; ending?: string; characterSlug?: string;
  languageCode?: "ja" | "ko"; characterSystem?: string; responseMode?: "tiles" | "typing" | "independent";
};
export type WritingLesson = { slug: string; title: string; stage: string; description: string; blocks: WritingBlock[]; exercises: WritingExercise[] };

export const writingCourse: WritingLesson[] = [
  {
    slug: "writing-introduction", title: "Meet Japanese writing", stage: "Introduction",
    description: "Discover why Japanese uses three scripts, and see them together.",
    blocks: [
      { title: "Three scripts, different jobs", text: "Japanese adopted Chinese characters (Kanji), then developed Kana to represent Japanese sounds. Modern writing combines them: Kanji often carries a word's core meaning, while Hiragana supplies many endings and particles. Katakana often signals borrowed words. You will also see Latin letters and numbers." },
      { title: "Read one sentence together", text: "Tap the colored parts below to discover their script. This sentence uses all three systems.", japanese: "私はコーヒーを飲みます。", reading: "Watashi wa kōhī o nomimasu.", translation: "I drink coffee.", segments: [{ text: "私", system: "kanji" }, { text: "は", system: "hiragana" }, { text: "コーヒー", system: "katakana" }, { text: "を", system: "hiragana" }, { text: "飲", system: "kanji" }, { text: "みます", system: "hiragana" }] },
      { title: "Two writing directions", text: "Horizontal Japanese runs left to right, with lines going down. Traditional vertical text runs top to bottom, with columns progressing from right to left. Books, signs, and digital screens may use different layouts.", japanese: "あいうえお" },
      { title: "The ending matters", text: "A Japanese predicate commonly comes at the end. In the coffee example, 飲みます (drink) finishes the sentence. Subjects and topics can be omitted when the context makes them clear." },
      { title: "Sound is not meaning", text: "The Kana あ represents the sound a; it does not normally mean a separate English word. Kanji such as 山 (mountain) carries meaning and can have different readings in different words." },
    ],
    exercises: [
      { slug: "coffee-script", kind: "choice", prompt: "Which script writes コーヒー (coffee)?", choices: ["Hiragana", "Katakana", "Kanji"], answer: "Katakana", explanation: "コーヒー is a borrowed word written in Katakana." },
      { slug: "kana-sound", kind: "choice", prompt: "What does a Kana character normally represent?", choices: ["A sound", "Always a whole English meaning", "Always a full sentence"], answer: "A sound", explanation: "Kana represent sounds. A written word may combine several Kana." },
    ],
  },
  {
    slug: "three-writing-systems", title: "Hiragana, Katakana, and Kanji", stage: "Writing systems",
    description: "Learn when to use each script.",
    blocks: [
      { title: "Hiragana: ひらがな", text: "Use Hiragana for particles such as は and を, grammatical endings, and many Japanese words. Beginners can write words in Hiragana before learning their Kanji.", japanese: "ねこ", reading: "neko", translation: "cat" },
      { title: "Katakana: カタカナ", text: "Katakana represents the same core sounds as Hiragana. It is often used for loanwords, foreign names, emphasis, and some sound effects.", japanese: "カメラ", reading: "kamera", translation: "camera" },
      { title: "Kanji: 漢字", text: "Kanji carries meaning, but its reading depends on context. Learn the reading of a word rather than assuming one sound works everywhere.", japanese: "山", reading: "yama (in this word)", translation: "mountain" },
    ],
    exercises: [
      { slug: "hiragana", kind: "choice", prompt: "Which word is written entirely in Hiragana?", choices: ["ねこ", "カメラ", "山"], answer: "ねこ", explanation: "ねこ uses Hiragana, カメラ uses Katakana, and 山 is Kanji." },
      { slug: "kanji-reading", kind: "choice", prompt: "How should you learn a Kanji reading?", choices: ["In a word and context", "Assume every Kanji has one reading"], answer: "In a word and context", explanation: "For example, 日 is read differently in 日本 and 日曜日." },
    ],
  },
  {
    slug: "hiragana-a", title: "Your first Hiragana: あ", stage: "Characters and handwriting",
    description: "Hear a, watch its three strokes, trace, then write without a guide.",
    blocks: [
      { title: "Meet あ", text: "あ is Hiragana. Its romanization is a, with a vowel sound similar to the a in father. It represents a sound rather than an independent English meaning.", japanese: "あ", reading: "a" },
      { title: "Use it in a word", text: "In あさ, combine あ (a) and さ (sa) to read asa. The word means morning.", japanese: "あさ", reading: "asa", translation: "morning" },
      { title: "Use it in a sentence", text: "This is a polite statement with です at the end. You will learn this pattern in the grammar lessons.", japanese: "あさです。", reading: "Asa desu.", translation: "It is morning." },
    ],
    exercises: [
      { slug: "read-a", kind: "choice", prompt: "Choose the reading of あ.", choices: ["a", "i", "u", "e"], answer: "a", explanation: "あ is read a. Its stroke order has three strokes." },
      { slug: "write-a", kind: "character", prompt: "Trace あ, then write it independently.", answer: "あ", explanation: "Follow the verified three-stroke demonstration. Your drawing is self-reported practice, not an automated handwriting score.", characterSlug: "3042" },
    ],
  },
  {
    slug: "word-formation", title: "Build your first words", stage: "Word formation",
    description: "Combine Kana sounds, and notice small characters and long vowels.",
    blocks: [
      { title: "Sounds become words", text: "Combine あ + さ to form あさ (morning). The sound of an individual Kana and the meaning of the completed word are different concepts.", japanese: "あさ", reading: "asa", translation: "morning" },
      { title: "Small characters change the sound", text: "A small ゃ, ゅ, or ょ combines with the previous character: き + ゃ becomes きゃ (kya), not ki-ya. Small っ creates a short hold before the following consonant.", japanese: "きって", reading: "kitte", translation: "postage stamp" },
      { title: "Keep long vowels long", text: "The mark ー lengthens the previous vowel in many Katakana words. コーヒー has a long o and a long i.", japanese: "コーヒー", reading: "kōhī", translation: "coffee" },
    ],
    exercises: [
      { slug: "morning", kind: "word", prompt: "Arrange the Kana to write morning (asa).", tiles: ["さ", "あ"], answer: "あさ", reading: "asa", explanation: "あ (a) + さ (sa) makes あさ, morning." },
      { slug: "cat", kind: "word", prompt: "Arrange the Kana to write cat (neko).", tiles: ["こ", "ね"], answer: "ねこ", reading: "neko", explanation: "ね (ne) + こ (ko) makes ねこ, cat." },
      { slug: "small-tsu", kind: "choice", prompt: "What does small っ do in きって?", choices: ["Adds a short hold before t", "Makes a long i", "Means morning"], answer: "Adds a short hold before t", explanation: "きって is kitte. The small っ doubles the following consonant." },
    ],
  },
  {
    slug: "polite-statements", title: "Make a statement with です", stage: "Basic grammar",
    description: "Write a short, polite identification sentence.",
    blocks: [{ title: "Noun + です", text: "です makes a noun statement polite. ねこです can mean It is a cat when the topic is clear. It is not a direct translation for every use of the English verb to be.", japanese: "ねこです。", reading: "Neko desu.", translation: "It is a cat." }],
    exercises: [{ slug: "cat-statement", kind: "sentence", prompt: "Write: It is a cat.", tiles: ["です", "ねこ"], answer: "ねこです。", alternatives: ["猫です。"], reading: "Neko desu.", hint: "cat (ねこ) + です", ending: "です", explanation: "Put the noun first and finish with です. The understood topic need not be written." }],
  },
  {
    slug: "topic-wa", title: "Introduce a topic with は", stage: "Basic grammar",
    description: "Tell someone what you are talking about.",
    blocks: [{ title: "Topic + は + comment", text: "は marks the topic: as for this. In this role it is pronounced wa, even though the ordinary Hiragana reading is ha. 私は学生です means As for me, I am a student.", japanese: "私は学生です。", reading: "Watashi wa gakusei desu.", translation: "I am a student." }],
    exercises: [{ slug: "student", kind: "sentence", prompt: "Write: I am a student. Include 私 (I) as the topic.", tiles: ["学生", "です", "は", "私"], answer: "私は学生です。", alternatives: ["わたしはがくせいです。", "私はがくせいです。", "わたしは学生です。"], requiredParticle: "は", ending: "です", reading: "Watashi wa gakusei desu.", hint: "私 + は + 学生 + です", explanation: "は follows the topic 私. 学生 is the description, and です finishes the polite statement." }],
  },
  {
    slug: "questions-ka", title: "Ask a question with か", stage: "Sentence construction",
    description: "Turn a polite statement into a question.",
    blocks: [{ title: "Add か at the end", text: "For this polite pattern, add か after です. Japanese does not need to reverse the noun and verb to form this question. A question mark may be used, but か already marks the question.", japanese: "学生ですか。", reading: "Gakusei desu ka.", translation: "Are you a student?" }],
    exercises: [{ slug: "student-question", kind: "sentence", prompt: "Ask: Are you a student? Use the short form with no explicit topic.", tiles: ["か", "です", "学生"], answer: "学生ですか。", alternatives: ["がくせいですか。"], requiredParticle: "か", ending: "ですか", reading: "Gakusei desu ka.", hint: "学生 + です + か", explanation: "学生です is a statement. Adding か after です makes it a question." }],
  },
  {
    slug: "likes", title: "Say what you like", stage: "Sentence construction",
    description: "Use が好きです to talk about a preference.",
    blocks: [{ title: "Thing + が + 好きです", text: "好き is an adjective-like expression for being fond of something. In this pattern, が marks the thing liked. It is not an action verb taking を.", japanese: "ねこが好きです。", reading: "Neko ga suki desu.", translation: "I like cats." }],
    exercises: [{ slug: "like-cats", kind: "sentence", prompt: "Write: I like cats. Leave the topic understood.", tiles: ["好き", "が", "です", "ねこ"], answer: "ねこが好きです。", alternatives: ["猫が好きです。", "ねこがすきです。", "猫がすきです。"], requiredParticle: "が", ending: "です", reading: "Neko ga suki desu.", hint: "ねこ + が + 好き + です", explanation: "が marks ねこ in this preference pattern. 好きです completes the polite sentence." }],
  },
  {
    slug: "dislikes", title: "Say what you do not like", stage: "Sentence construction",
    description: "Use a gentle negative preference.",
    blocks: [{ title: "好きではありません", text: "好きではありません is a polite negative of 好きです: do not like. 好きじゃありません is also a common polite conversational form. 嫌いです expresses dislike more directly.", japanese: "コーヒーが好きではありません。", reading: "Kōhī ga suki dewa arimasen.", translation: "I do not like coffee." }],
    exercises: [{ slug: "not-coffee", kind: "sentence", prompt: "Write politely: I do not like coffee. Leave the topic understood.", tiles: ["ではありません", "コーヒー", "好き", "が"], answer: "コーヒーが好きではありません。", alternatives: ["コーヒーがすきではありません。", "コーヒーが好きじゃありません。", "コーヒーがすきじゃありません。", "コーヒーが嫌いです。", "コーヒーがきらいです。"], requiredParticle: "が", reading: "Kōhī ga suki dewa arimasen.", hint: "コーヒー + が + 好き + ではありません", explanation: "が marks the preference's object. 好きではありません is a polite negative; 好きじゃありません is conversational. 嫌いです is a stronger statement of dislike." }],
  },
  {
    slug: "objects-and-verbs", title: "Objects and verb endings", stage: "Sentence construction",
    description: "Use を and place the action at the end.",
    blocks: [{ title: "Object + を + verb", text: "を marks a direct object and is normally pronounced o. In 水を飲みます, 水 is what is drunk. The verb 飲みます comes after the object. The understood I is omitted here.", japanese: "水を飲みます。", reading: "Mizu o nomimasu.", translation: "I drink water." }],
    exercises: [{ slug: "drink-water", kind: "sentence", prompt: "Write: I drink water. Leave the topic understood.", tiles: ["飲みます", "水", "を"], answer: "水を飲みます。", alternatives: ["みずをのみます。", "水をのみます。", "みずを飲みます。"], requiredParticle: "を", ending: "ます", reading: "Mizu o nomimasu.", hint: "水 + を + 飲みます", explanation: "を follows the thing being drunk, 水. Finish with the verb 飲みます. Do not use the topic particle は in place of を for this target pattern." }],
  },
  {
    slug: "everyday-sentences", title: "Write an everyday sentence", stage: "Independent writing",
    description: "Combine a topic, an object, and an action.",
    blocks: [{ title: "Put your pieces together", text: "私 is the topic, は marks it, 本 is the direct object, を marks it, and 読みます is the final action. Spaces in the guide are just for learning; ordinary Japanese usually does not put spaces between words.", japanese: "私は本を読みます。", reading: "Watashi wa hon o yomimasu.", translation: "I read a book." }],
    exercises: [{ slug: "read-book", kind: "sentence", prompt: "Write: I read a book. Include 私 as the topic.", tiles: ["本", "読みます", "は", "を", "私"], answer: "私は本を読みます。", alternatives: ["わたしはほんをよみます。", "私はほんを読みます。", "私は本をよみます。", "わたしは本を読みます。"], requiredParticle: "を", ending: "ます", reading: "Watashi wa hon o yomimasu.", hint: "私 + は + 本 + を + 読みます", explanation: "The topic 私は comes first in this model. 本を identifies what is read, and 読みます closes the sentence." }],
  },
  {
    slug: "writing-review", title: "Review your writing toolkit", stage: "Review and mastery",
    description: "Review scripts, pronunciation, grammar, and sentence writing.",
    blocks: [{ title: "A useful beginning", text: "You have met Kana sounds, meaningful Kanji, stroke order, and a few sentence patterns. Keep using the full character grid for daily practice. Workbook completion records practice and recall, not verified handwriting accuracy or full Japanese proficiency." }],
    exercises: [
      { slug: "wa-reading", kind: "choice", prompt: "How is は pronounced when it marks the topic?", choices: ["wa", "ha", "o"], answer: "wa", explanation: "The topic particle は is pronounced wa. In many words it is ha." },
      { slug: "verb-position", kind: "choice", prompt: "Where does the verb go in 水を飲みます?", choices: ["At the end", "Before 水", "It is not needed"], answer: "At the end", explanation: "飲みます is the action and comes after the direct object 水を." },
      { slug: "review-tea", kind: "sentence", prompt: "Write: I drink tea. Leave the topic understood.", tiles: ["飲みます", "お茶", "を"], answer: "お茶を飲みます。", alternatives: ["おちゃをのみます。", "お茶をのみます。", "おちゃを飲みます。"], requiredParticle: "を", ending: "ます", reading: "Ocha o nomimasu.", hint: "お茶 + を + 飲みます", explanation: "Use を after お茶, then place 飲みます at the end." },
    ],
  },
];
