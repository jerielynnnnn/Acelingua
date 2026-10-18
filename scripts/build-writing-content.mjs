// Generates local curriculum and SQL only. Never connects to the database.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const uid = key => {
  const h = createHash('md5').update(`acelingua:writing:${key}`).digest('hex');
  return `${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20)}`;
};
const systems = [
  ['ja','hiragana','Hiragana','Sound-based characters for everyday Japanese.'],
  ['ja','katakana','Katakana','Characters used for loanwords and foreign names.'],
  ['ja','kanji','Kanji','Beginner characters for numbers, days, and daily life.'],
  ['ko','consonants','Hangul Consonants','Explore Korean consonants.'],
  ['ko','vowels','Hangul Vowels','Explore Korean vowels.'],
  ['ko','syllables','Syllable Formation','Build syllable blocks.'],
  ['es','alphabet','Alphabet and Letter Names','Explore Spanish letters.'],
  ['es','pronunciation','Pronunciation','Explore Spanish letter sounds.'],
  ['es','accents','Accents and Special Characters','Learn accents, ñ, and ü.'],
].map(([language,slug,name,description], index) => ({id:uid(`${language}/${slug}`),language,slug,name,description,display_order:index%3}));
const characters = [];
const offline = process.argv.includes('--offline');
const add = (system, character, romanization, meaning, group, example_word=null, example_translation=null, note=null) => {
  const slug = [...character].map(c=>c.codePointAt(0).toString(16)).join('-');
  characters.push({id:uid(`ja/${system}/${slug}`),writing_system_id:uid(`ja/${system}`),slug,character,romanization,meaning,group,example_word,example_translation,note,display_order:characters.filter(c=>c.writing_system_id===uid(`ja/${system}`)).length,stroke_count:null,stroke_data:null,audio_url:null});
};
const rows = [
 ['Vowels','あいうえお','a i u e o'],['K row','かきくけこ','ka ki ku ke ko'],['S row','さしすせそ','sa shi su se so'],
 ['T row','たちつてと','ta chi tsu te to'],['N row','なにぬねの','na ni nu ne no'],['H row','はひふへほ','ha hi fu he ho'],
 ['M row','まみむめも','ma mi mu me mo'],['Y row','やゆよ','ya yu yo'],['R row','らりるれろ','ra ri ru re ro'],['W row and N','わをん','wa o n'],
 ['Dakuten: G','がぎぐげご','ga gi gu ge go'],['Dakuten: Z','ざじずぜぞ','za ji zu ze zo'],['Dakuten: D','だぢづでど','da ji zu de do'],
 ['Dakuten: B','ばびぶべぼ','ba bi bu be bo'],['Handakuten: P','ぱぴぷぺぽ','pa pi pu pe po'],
];
const examples = {
 あ:['あさ','morning'],い:['いぬ','dog'],う:['うみ','sea'],え:['えき','station'],お:['おと','sound'],
 か:['かさ','umbrella'],き:['き','tree'],く:['くち','mouth'],け:['けむり','smoke'],こ:['こえ','voice'],
 さ:['さかな','fish'],し:['しお','salt'],す:['すし','sushi'],せ:['せかい','world'],そ:['そら','sky'],
 た:['たまご','egg'],ち:['ちず','map'],つ:['つき','moon'],て:['て','hand'],と:['とり','bird'],
 な:['なつ','summer'],に:['にく','meat'],ぬ:['ぬの','cloth'],ね:['ねこ','cat'],の:['のり','seaweed'],
 は:['はな','flower'],ひ:['ひと','person'],ふ:['ふね','boat'],へ:['へや','room'],ほ:['ほし','star'],
 ま:['まど','window'],み:['みみ','ear'],む:['むし','insect'],め:['め','eye'],も:['もり','forest'],
 や:['やま','mountain'],ゆ:['ゆき','snow'],よ:['よる','night'],ら:['らいねん','next year'],り:['りんご','apple'],る:['るす','absence'],れ:['れきし','history'],ろ:['ろく','six'],わ:['わたし','I; me'],を:['みずをのむ','drink water'],ん:['ほん','book'],
 が:['がっこう','school'],ぎ:['ぎんこう','bank'],ぐ:['ぐあい','condition'],げ:['げんき','healthy; energetic'],ご:['ごはん','rice; meal'],
 ざ:['ざっし','magazine'],じ:['じかん','time'],ず:['みず','water'],ぜ:['かぜ','wind'],ぞ:['ぞう','elephant'],
 だ:['だいがく','university'],ぢ:['はなぢ','nosebleed'],づ:['つづく','continue'],で:['でんわ','telephone'],ど:['どこ','where'],
 ば:['ばしょ','place'],び:['びょういん','hospital'],ぶ:['ぶた','pig'],べ:['べんり','convenient'],ぼ:['ぼうし','hat'],
 ぱ:['ぱんだ','panda'],ぴ:['ぴかぴか','sparkling'],ぷ:['ぷかぷか','floating'],ぺ:['ぺらぺら','fluently'],ぽ:['ぽかぽか','pleasantly warm'],
};
const loans = {ア:['アイス','ice cream'],イ:['インク','ink'],ウ:['ウール','wool'],エ:['エアコン','air conditioner'],オ:['オレンジ','orange'],カ:['カメラ','camera'],キ:['キロ','kilo'],ク:['クラス','class'],ケ:['ケーキ','cake'],コ:['コーヒー','coffee'],サ:['サラダ','salad'],シ:['シャツ','shirt'],ス:['スープ','soup'],セ:['セーター','sweater'],ソ:['ソファ','sofa'],タ:['タクシー','taxi'],チ:['チーズ','cheese'],ツ:['ツアー','tour'],テ:['テレビ','television'],ト:['トマト','tomato'],ナ:['ナイフ','knife'],ニ:['ニュース','news'],ヌ:['ヌードル','noodle'],ネ:['ネクタイ','necktie'],ノ:['ノート','notebook'],ハ:['ハンバーガー','hamburger'],ヒ:['ヒント','hint'],フ:['フルーツ','fruit'],ヘ:['ヘルメット','helmet'],ホ:['ホテル','hotel'],マ:['マスク','mask'],ミ:['ミルク','milk'],ム:['ムード','mood'],メ:['メール','email'],モ:['モデル','model'],ヤ:['ヤード','yard'],ユ:['ユニフォーム','uniform'],ヨ:['ヨーグルト','yogurt'],ラ:['ラジオ','radio'],リ:['リモコン','remote control'],ル:['ルール','rule'],レ:['レストラン','restaurant'],ロ:['ロボット','robot'],ワ:['ワイン','wine'],ン:['パン','bread'],ガ:['ガス','gas'],ギ:['ギター','guitar'],グ:['グラス','glass'],ゲ:['ゲーム','game'],ゴ:['ゴール','goal'],ザ:['ピザ','pizza'],ジ:['ジーンズ','jeans'],ズ:['ズボン','trousers'],ゼ:['ゼロ','zero'],ゾ:['ゾーン','zone'],ダ:['ダンス','dance'],デ:['デザイン','design'],ド:['ドア','door'],バ:['バス','bus'],ビ:['ビール','beer'],ブ:['ブラシ','brush'],ベ:['ベッド','bed'],ボ:['ボール','ball'],パ:['パン','bread'],ピ:['ピアノ','piano'],プ:['プール','swimming pool'],ペ:['ペン','pen'],ポ:['ポスト','mailbox']};
const katakana = text => [...text].map(c=>String.fromCodePoint(c.codePointAt(0)+0x60)).join('');
for (const [group,kana,readings] of rows) for (const [i,char] of [...kana].entries()) {
  const reading = readings.split(' ')[i];
  add('hiragana',char,reading,`Sound: ${reading}`,group,...(examples[char]??[null,null]),char==='を'?'The object particle を is normally pronounced o.':char==='は'?'As the topic particle, は is pronounced wa.':char==='へ'?'As a direction particle, へ is pronounced e.':null);
  const kata=katakana(char);
  add('katakana',kata,reading,`Sound: ${reading}`,group,...(loans[kata]??[null,null]),kata==='ヲ'?'Rare outside special contexts; usually pronounced o.':null);
}
const contractions = [['き','ky'],['し','sh'],['ち','ch'],['に','ny'],['ひ','hy'],['み','my'],['り','ry'],['ぎ','gy'],['じ','j'],['び','by'],['ぴ','py']];
const contractedExamples={きゃ:['きゃく','guest'],きゅ:['きゅう','nine'],きょ:['きょう','today'],しゃ:['しゃしん','photograph'],しゅ:['しゅみ','hobby'],しょ:['しょくじ','meal'],ちゃ:['おちゃ','tea'],ちゅ:['ちゅうい','attention'],ちょ:['ちょっと','a little'],にゃ:['にゃん','meow'],にゅ:['にゅうがく','entering school'],にょ:['にょらい','Tathagata (Buddhist term)'],ひゃ:['ひゃく','hundred'],ひゅ:['ひゅうひゅう','whistling sound'],ひょ:['ひょう','leopard'],みゃ:['みゃく','pulse'],みゅ:['ミュージック','music'],みょ:['みょうじ','surname'],りゃ:['りゃく','abbreviation'],りゅ:['りゅう','dragon'],りょ:['りょこう','travel'],ぎゃ:['ぎゃく','reverse'],ぎゅ:['ぎゅうにく','beef'],ぎょ:['ぎょうざ','dumplings'],じゃ:['じゃあ','well then'],じゅ:['じゅう','ten'],じょ:['じょうず','skillful'],びゃ:['びゃくや','white night'],びゅ:['びゅうびゅう','howling sound'],びょ:['びょういん','hospital'],ぴゃ:['ぴゃっと','quickly (mimetic)'],ぴゅ:['ぴゅうぴゅう','whistling sound'],ぴょ:['ぴょんぴょん','hopping']};
const contractLoans={キャ:['キャンプ','camping'],キュ:['キューブ','cube'],キョ:['キョスク','kiosk'],シャ:['シャツ','shirt'],シュ:['シューズ','shoes'],ショ:['ショップ','shop'],チャ:['チャンス','chance'],チュ:['チューブ','tube'],チョ:['チョコレート','chocolate'],ニュ:['ニュース','news'],ミュ:['ミュージック','music'],リュ:['リュック','backpack'],ギュ:['レギュラー','regular'],ジャ:['ジャム','jam'],ジュ:['ジュース','juice'],ジョ:['ジョギング','jogging'],ビュ:['ビュー','view'],ピュ:['ピュア','pure']};
// Omit examples that are not suitable for the displayed script or need editorial review.
delete contractedExamples['みゅ'];
delete contractedExamples['ぴゃ'];
delete contractLoans['キョ'];
for(const [stem,prefix] of contractions) for(const [small,vowel] of [['ゃ','a'],['ゅ','u'],['ょ','o']]) {
 const char=stem+small, reading=prefix+vowel;
 add('hiragana',char,reading,`Combined sound: ${reading}`,'Contracted sounds',...(contractedExamples[char]??[null,null]));
 const kata=katakana(char); add('katakana',kata,reading,`Combined sound: ${reading}`,'Contracted sounds',...(contractLoans[kata]??[null,null]));
}
add('hiragana','っ','small tsu','Doubles the following consonant','Small characters','きって','postage stamp','Pause briefly before the next consonant; this is not a full tsu syllable.');
add('hiragana','おう','ō / ou','Long o pattern','Long vowels','おうさま','king','Often a long o, depending on the word.');
add('hiragana','えい','ē / ei','Long e pattern','Long vowels','えいが','movie','Often a long e; careful speech may retain ei.');
add('katakana','ッ','small tsu','Doubles the following consonant','Small characters','キット','kit');
add('katakana','ー','long vowel mark','Lengthens the preceding vowel','Long vowels','コーヒー','coffee');
const kanji = [
 ['一','いち / ichi','one','Numbers','一つ','one thing'],['二','に / ni','two','Numbers','二月','February'],['三','さん / san','three','Numbers','三月','March'],['四','よん・し / yon, shi','four','Numbers','四月','April'],['五','ご / go','five','Numbers','五月','May'],['六','ろく / roku','six','Numbers','六月','June'],['七','なな・しち / nana, shichi','seven','Numbers','七月','July'],['八','はち / hachi','eight','Numbers','八月','August'],['九','きゅう・く / kyū, ku','nine','Numbers','九月','September'],['十','じゅう / jū','ten','Numbers','十月','October'],['百','ひゃく / hyaku','hundred','Numbers','百円','one hundred yen'],
 ['日','にち・ひ / nichi, hi','sun; day','Days','日曜日','Sunday'],['月','げつ・つき / getsu, tsuki','moon; month','Days','月曜日','Monday'],['火','か・ひ / ka, hi','fire','Days','火曜日','Tuesday'],['水','すい・みず / sui, mizu','water','Days','水曜日','Wednesday'],['木','もく・き / moku, ki','tree; wood','Days','木曜日','Thursday'],['金','きん・かね / kin, kane','gold; money','Days','金曜日','Friday'],['土','ど・つち / do, tsuchi','earth; soil','Days','土曜日','Saturday'],
 ['人','じん・ひと / jin, hito','person','Everyday','日本人','Japanese person'],['口','こう・くち / kō, kuchi','mouth','Everyday','入口','entrance'],['山','さん・やま / san, yama','mountain','Everyday','山','mountain'],['川','せん・かわ / sen, kawa','river','Everyday','川','river'],['田','でん・た / den, ta','rice field','Everyday','田んぼ','rice field'],['目','もく・め / moku, me','eye','Everyday','目','eye'],['手','しゅ・て / shu, te','hand','Everyday','手','hand'],['本','ほん・もと / hon, moto','book; origin','Everyday','本','book'],['学','がく・まなぶ / gaku, manabu','study; learning','Everyday','学校','school'],['生','せい・いきる / sei, ikiru','life; birth','Everyday','学生','student'],
];
for(const row of kanji) add('kanji',...row,null);

await mkdir('public/writing/kanjivg',{recursive:true});
await mkdir('lib/writing',{recursive:true});
// Pin the source revision in the generated provenance file.
let revision;
if (offline) {
 revision = (await readFile('public/writing/kanjivg/ATTRIBUTION.md', 'utf8')).match(/tree\/([a-f0-9]{40})/)[1];
} else {
 const revisionResponse = await fetch('https://api.github.com/repos/KanjiVG/kanjivg/commits/master');
 if(!revisionResponse.ok) throw Error(`Cannot resolve KanjiVG revision: ${revisionResponse.status}`);
 revision=(await revisionResponse.json()).sha;
}
const glyphs=[...new Set(characters.flatMap(c=>[...c.character]))];
const data=new Map(); let cursor=0; const missing=[];
await Promise.all(Array.from({length:4},async()=>{
 while(cursor<glyphs.length){
  const char=glyphs[cursor++],hex=char.codePointAt(0).toString(16).padStart(5,'0');
  let svg;
  if (offline) svg=await readFile(`public/writing/kanjivg/${hex}.svg`, 'utf8');
  else {
   const response=await fetch(`https://raw.githubusercontent.com/KanjiVG/kanjivg/${revision}/kanji/${hex}.svg`);
   if(response.status===404){missing.push(char);continue;}
   if(!response.ok)throw Error(`KanjiVG ${hex}: ${response.status}`);
   svg=await response.text();
  }
  if(/<g[^>]*transform=/.test(svg))throw Error(`Needs group transforms: ${hex}`);
  const paths=[...svg.matchAll(/<path\b[^>]*\bid="kvg:[^"]+-s(\d+)"[^>]*\bd="([^"]+)"[^>]*\/>/g)].map(m=>({order:Number(m[1]),d:m[2]}));
  if(!paths.length||paths.some((p,i)=>p.order!==i+1))throw Error(`Invalid stroke sequence ${hex}`);
  await writeFile(`public/writing/kanjivg/${hex}.svg`,svg);
  data.set(char,paths.map(p=>p.d));
 }
}));
for(const char of characters){
 const glyphs=[...char.character];
 if(glyphs.every(g=>data.has(g))){
  const paths=glyphs.flatMap((g,i)=>data.get(g).map(d=>({d,x:i*109})));
  char.stroke_count=paths.length;
  char.stroke_data={viewBox:`0 0 ${109*glyphs.length} 109`,paths,source:'KanjiVG',revision};
 }
}
if (!offline) {
 const licenseResponse=await fetch(`https://raw.githubusercontent.com/KanjiVG/kanjivg/${revision}/COPYING`);
 if(!licenseResponse.ok)throw Error('Cannot download license');
 await writeFile('public/writing/kanjivg/LICENSE.txt',await licenseResponse.text());
}
await writeFile('public/writing/kanjivg/ATTRIBUTION.md',`# KanjiVG\n\nCopyright (C) Ulrich Apel and KanjiVG contributors.\nSource: https://github.com/KanjiVG/kanjivg/tree/${revision}\nLicense: CC BY-SA 3.0, https://creativecommons.org/licenses/by-sa/3.0/\nOriginal SVG files are preserved. Extracted paths are arranged left-to-right for multi-character patterns; paths and stroke order within each glyph are unchanged. Extracted stroke data is also CC BY-SA 3.0.\n`);
await writeFile('lib/writing/content.json',JSON.stringify({systems,characters},null,2)+'\n');
// SQL seeds are explicit and idempotent. Existing reviewed content is not overwritten.
const q=v=>v===null?'null':"'"+String(v).replaceAll("'","''")+"'";
let sql='-- Generated by scripts/build-writing-content.mjs. Review before applying.\nbegin;\n';
for(const system of systems)sql+=`insert into public.writing_systems (id,language_id,name,slug,description,display_order,is_published) select ${q(system.id)},id,${q(system.name)},${q(system.slug)},${q(system.description)},${system.display_order},true from public.languages where code=${q(system.language)} on conflict do nothing;\n`;
for(const c of characters)sql+=`insert into public.writing_characters (id,writing_system_id,slug,character,romanization,meaning,group_name,example_word,example_translation,note,stroke_count,stroke_data,audio_url,display_order,is_published) select ${q(c.id)},${q(c.writing_system_id)},${q(c.slug)},${q(c.character)},${q(c.romanization)},${q(c.meaning)},${q(c.group)},${q(c.example_word)},${q(c.example_translation)},${q(c.note)},${c.stroke_count??'null'},${c.stroke_data?q(JSON.stringify(c.stroke_data))+'::jsonb':'null'},null,${c.display_order},true where exists(select 1 from public.writing_systems where id=${q(c.writing_system_id)}) on conflict do nothing;\n`;
sql+='commit;\n';
await writeFile('supabase/writing-studio-seed.sql',sql);
console.log(`Prepared ${characters.length} characters, ${data.size} source glyphs, revision ${revision}. Missing stroke data: ${missing.join(' ')||'none'}.`);
