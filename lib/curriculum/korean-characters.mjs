// Reading/pronunciation drafts only. No stroke counts, paths, or audio are invented.
const groups = [
 ['consonants','Basic consonants',[
  ['ㄱ','g/k','Plain consonant; its realization changes with position.','가방','bag'],['ㄴ','n','Touch the tongue to the ridge behind the upper teeth.','나무','tree'],['ㄷ','d/t','A plain stop; compare aspirated ㅌ and tense ㄸ.','다리','bridge / leg'],['ㄹ','r/l','A brief tap between vowels, often l-like in a final position.','라디오','radio'],['ㅁ','m','Close both lips and let air through the nose.','모자','hat'],['ㅂ','b/p','A plain lip stop; compare ㅍ and ㅃ.','바다','sea'],['ㅅ','s','An s-like sound, often sh-like before 이 and related vowels.','사과','apple'],['ㅇ','silent/ng','Silent initially; ng in the final position.','아이','child'],['ㅈ','j','Plain affricate; compare ㅊ and ㅉ.','지도','map'],['ㅊ','ch','Aspirated affricate with a stronger puff of air.','차','tea (here)'],['ㅋ','k','Aspirated counterpart of ㄱ.','코','nose'],['ㅌ','t','Aspirated counterpart of ㄷ.','토끼','rabbit'],['ㅍ','p','Aspirated counterpart of ㅂ.','포도','grapes'],['ㅎ','h','An h-like sound with context-dependent sound changes.','하늘','sky'],
 ]],
 ['vowels','Basic vowels',[
  ['ㅏ','a','Open vowel; practice in 아 rather than reading the Latin name.','아이','child'],['ㅑ','ya','Begins with a y-like glide into ㅏ.','야구','baseball'],['ㅓ','eo','A back vowel distinct from ㅗ; not a two-vowel sequence e-o.','어머니','mother'],['ㅕ','yeo','A y-like glide into ㅓ.','여우','fox'],['ㅗ','o','Rounded vowel; contrast with ㅓ.','오이','cucumber'],['ㅛ','yo','A y-like glide into ㅗ.','요리','cooking'],['ㅜ','u','Rounded high back vowel; contrast with unrounded ㅡ.','우유','milk'],['ㅠ','yu','A y-like glide into ㅜ.','유리','glass'],['ㅡ','eu','High back unrounded vowel; avoid English oo.','그릇','bowl'],['ㅣ','i','High front vowel; a single steady vowel.','이름','name'],
 ]],
 ['vowels','Compound vowels',[
  ['ㅐ','ae','Often merges in pronunciation with ㅔ for modern speakers; preserve spelling.','개','dog'],['ㅒ','yae','A y-like glide before ㅐ.','얘기','talk / story'],['ㅔ','e','Preserve spelling even where ㅔ and ㅐ sound alike.','게','crab'],['ㅖ','ye','A y-like glide before ㅔ.','예','yes (polite)'],['ㅘ','wa','Combine ㅗ and ㅏ into one vowel unit.','과자','snack'],['ㅙ','wae','Compound vowel written with ㅗ and ㅐ.','왜','why'],['ㅚ','oe','Often pronounced like we in modern speech.','외국','foreign country'],['ㅝ','wo','Combine ㅜ and ㅓ.','원','won'],['ㅞ','we','Compound vowel written with ㅜ and ㅔ.','웨이터','waiter'],['ㅟ','wi','Often pronounced with a w-like glide.','귀','ear'],['ㅢ','ui','Pronunciation depends on position and grammatical use; study words.','의자','chair'],
 ]],
 ['consonants','Tense consonants',[
  ['ㄲ','kk','Tense counterpart of ㄱ; not the aspirated ㅋ.','꼬리','tail'],['ㄸ','tt','Tense counterpart of ㄷ.','딸','daughter'],['ㅃ','pp','Tense counterpart of ㅂ.','빵','bread'],['ㅆ','ss','Tense counterpart of ㅅ.','쌀','uncooked rice'],['ㅉ','jj','Tense counterpart of ㅈ.','짜요','It is salty'],
 ]],
 ['syllables','Syllable blocks and batchim',[
  ['가','ga','ㄱ sits beside vertical ㅏ.','가방','bag'],['고','go','ㄱ sits above horizontal ㅗ.','고기','meat'],['강','gang','Final ㅇ is ng, unlike silent initial ㅇ.','강','river'],['산','san','Final ㄴ sits beneath 사.','산','mountain'],['밥','bap','Final ㅂ is unreleased; 밥을 connects as 바블.','밥','cooked rice / meal'],
 ]],
];
export const koreanCharacters=groups.flatMap(([system,group,rows])=>rows.map(([character,romanization,note,example_word,example_translation])=>({system,group,slug:character.codePointAt(0).toString(16),character,romanization,note:note+' Stroke order requires review: no verified asset is attached.',example_word,example_translation,stroke_count:null,stroke_data:null,audio_url:null,review_status:'stroke_asset_required'})));
