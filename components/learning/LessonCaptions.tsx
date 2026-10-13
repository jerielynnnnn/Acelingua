"use client";
import { useState } from "react";

export default function LessonCaptions({ text, pronunciation, translation, languageCode, initiallyVisible = false }: {
  text: string; pronunciation?: string | null; translation?: string | null; languageCode: string; initiallyVisible?: boolean;
}) {
  const [visible, setVisible] = useState(initiallyVisible);
  const [romanization, setRomanization] = useState(false);
  const [english, setEnglish] = useState(false);
  return <div className="mt-4 rounded-2xl border border-[#C7A9D4]/35 p-4 text-left"><div className="flex flex-wrap gap-4 text-xs font-semibold"><label><input type="checkbox" checked={visible} onChange={event => setVisible(event.target.checked)} /> Subtitles</label>{pronunciation && <label><input type="checkbox" checked={romanization} onChange={event => setRomanization(event.target.checked)} /> Pronunciation guide</label>}{translation && <label><input type="checkbox" checked={english} onChange={event => setEnglish(event.target.checked)} /> English translation</label>}</div>{visible && <div className="mt-3 space-y-2"><p lang={languageCode} className="font-bold">{text}</p>{romanization && pronunciation && <p className="text-sm text-[#3558AE]">{pronunciation}</p>}{english && translation && <p className="text-sm text-[#62759C]">{translation}</p>}<p className="text-xs text-[#62759C]">Sentence-level captions</p></div>}</div>;
}
