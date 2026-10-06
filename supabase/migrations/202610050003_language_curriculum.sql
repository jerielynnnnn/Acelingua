-- Generated from supabase/curriculum.json by scripts/generate-curriculum.mjs.
-- Run after migrations 001 and 002 in the Supabase SQL Editor.
-- Each existing course gets its own starter units, lessons, and vocabulary IDs.
-- Existing content stays intact and follows the three new starter units.
-- Reruns do not duplicate seed content or overwrite existing records.
begin;

do $seed$
declare
  curriculum jsonb := $curriculum${
  "units": [
    {
      "title": "First conversations",
      "description": "Start with everyday greetings and polite expressions.",
      "lessons": [
        {
          "key": "greetings",
          "title": "Hello and goodbye",
          "description": "Learn three expressions to start and end a conversation."
        },
        {
          "key": "politeness",
          "title": "Being polite",
          "description": "Say thank you, make a polite request, and excuse yourself."
        }
      ]
    },
    {
      "title": "Words for everyday life",
      "description": "Build a foundation with numbers and colors.",
      "lessons": [
        {
          "key": "numbers",
          "title": "Your first numbers",
          "description": "Learn to recognize and say one, two, and three."
        },
        {
          "key": "colors",
          "title": "Naming colors",
          "description": "Learn the words for red, blue, and green."
        }
      ]
    },
    {
      "title": "Out and about",
      "description": "Learn useful words for food and finding your way.",
      "lessons": [
        {
          "key": "food",
          "title": "At the cafe",
          "description": "Learn the words for water, rice, and coffee."
        },
        {
          "key": "travel",
          "title": "Places to go",
          "description": "Recognize the words for a station, an airport, and a hotel."
        }
      ]
    }
  ],
  "languages": [
    {
      "code": "ja",
      "name": "Japanese",
      "native_name": "日本語",
      "flag_emoji": "🇯🇵",
      "course_title": "Japanese: your first conversations",
      "words": {
        "greetings": [
          [
            "こんにちは",
            "Hello",
            "konnichiwa"
          ],
          [
            "さようなら",
            "Goodbye",
            "sayōnara"
          ],
          [
            "おはようございます",
            "Good morning",
            "ohayō gozaimasu"
          ]
        ],
        "politeness": [
          [
            "ありがとう",
            "Thank you",
            "arigatō"
          ],
          [
            "お願いします",
            "Please",
            "onegaishimasu"
          ],
          [
            "すみません",
            "Excuse me",
            "sumimasen"
          ]
        ],
        "numbers": [
          [
            "一",
            "One",
            "ichi"
          ],
          [
            "二",
            "Two",
            "ni"
          ],
          [
            "三",
            "Three",
            "san"
          ]
        ],
        "colors": [
          [
            "赤",
            "Red",
            "aka"
          ],
          [
            "青",
            "Blue",
            "ao"
          ],
          [
            "緑",
            "Green",
            "midori"
          ]
        ],
        "food": [
          [
            "水",
            "Water",
            "mizu"
          ],
          [
            "ご飯",
            "Rice",
            "gohan"
          ],
          [
            "コーヒー",
            "Coffee",
            "kōhī"
          ]
        ],
        "travel": [
          [
            "駅",
            "Station",
            "eki"
          ],
          [
            "空港",
            "Airport",
            "kūkō"
          ],
          [
            "ホテル",
            "Hotel",
            "hoteru"
          ]
        ]
      }
    },
    {
      "code": "ko",
      "name": "Korean",
      "native_name": "한국어",
      "flag_emoji": "🇰🇷",
      "course_title": "Korean: your first conversations",
      "words": {
        "greetings": [
          [
            "안녕하세요",
            "Hello",
            "annyeonghaseyo"
          ],
          [
            "안녕히 가세요",
            "Goodbye",
            "annyeonghi gaseyo"
          ],
          [
            "좋은 아침이에요",
            "Good morning",
            "joeun achimieyo"
          ]
        ],
        "politeness": [
          [
            "감사합니다",
            "Thank you",
            "gamsahamnida"
          ],
          [
            "부탁합니다",
            "Please",
            "butakhamnida"
          ],
          [
            "실례합니다",
            "Excuse me",
            "sillyehamnida"
          ]
        ],
        "numbers": [
          [
            "하나",
            "One",
            "hana"
          ],
          [
            "둘",
            "Two",
            "dul"
          ],
          [
            "셋",
            "Three",
            "set"
          ]
        ],
        "colors": [
          [
            "빨강",
            "Red",
            "ppalgang"
          ],
          [
            "파랑",
            "Blue",
            "parang"
          ],
          [
            "초록",
            "Green",
            "chorok"
          ]
        ],
        "food": [
          [
            "물",
            "Water",
            "mul"
          ],
          [
            "밥",
            "Rice",
            "bap"
          ],
          [
            "커피",
            "Coffee",
            "keopi"
          ]
        ],
        "travel": [
          [
            "역",
            "Station",
            "yeok"
          ],
          [
            "공항",
            "Airport",
            "gonghang"
          ],
          [
            "호텔",
            "Hotel",
            "hotel"
          ]
        ]
      }
    },
    {
      "code": "zh",
      "name": "Mandarin Chinese",
      "native_name": "中文",
      "flag_emoji": "🇨🇳",
      "course_title": "Mandarin Chinese: your first conversations",
      "words": {
        "greetings": [
          [
            "你好",
            "Hello",
            "nǐ hǎo"
          ],
          [
            "再见",
            "Goodbye",
            "zài jiàn"
          ],
          [
            "早上好",
            "Good morning",
            "zǎo shang hǎo"
          ]
        ],
        "politeness": [
          [
            "谢谢",
            "Thank you",
            "xiè xie"
          ],
          [
            "请",
            "Please",
            "qǐng"
          ],
          [
            "不好意思",
            "Excuse me",
            "bù hǎo yì si"
          ]
        ],
        "numbers": [
          [
            "一",
            "One",
            "yī"
          ],
          [
            "二",
            "Two",
            "èr"
          ],
          [
            "三",
            "Three",
            "sān"
          ]
        ],
        "colors": [
          [
            "红色",
            "Red",
            "hóng sè"
          ],
          [
            "蓝色",
            "Blue",
            "lán sè"
          ],
          [
            "绿色",
            "Green",
            "lǜ sè"
          ]
        ],
        "food": [
          [
            "水",
            "Water",
            "shuǐ"
          ],
          [
            "米饭",
            "Rice",
            "mǐ fàn"
          ],
          [
            "咖啡",
            "Coffee",
            "kā fēi"
          ]
        ],
        "travel": [
          [
            "车站",
            "Station",
            "chē zhàn"
          ],
          [
            "机场",
            "Airport",
            "jī chǎng"
          ],
          [
            "酒店",
            "Hotel",
            "jiǔ diàn"
          ]
        ]
      }
    },
    {
      "code": "es",
      "name": "Spanish",
      "native_name": "Español",
      "flag_emoji": "🇪🇸",
      "course_title": "Spanish: your first conversations",
      "words": {
        "greetings": [
          [
            "Hola",
            "Hello",
            null
          ],
          [
            "Adiós",
            "Goodbye",
            null
          ],
          [
            "Buenos días",
            "Good morning",
            null
          ]
        ],
        "politeness": [
          [
            "Gracias",
            "Thank you",
            null
          ],
          [
            "Por favor",
            "Please",
            null
          ],
          [
            "Perdón",
            "Excuse me",
            null
          ]
        ],
        "numbers": [
          [
            "Uno",
            "One",
            null
          ],
          [
            "Dos",
            "Two",
            null
          ],
          [
            "Tres",
            "Three",
            null
          ]
        ],
        "colors": [
          [
            "Rojo",
            "Red",
            null
          ],
          [
            "Azul",
            "Blue",
            null
          ],
          [
            "Verde",
            "Green",
            null
          ]
        ],
        "food": [
          [
            "Agua",
            "Water",
            null
          ],
          [
            "Arroz",
            "Rice",
            null
          ],
          [
            "Café",
            "Coffee",
            null
          ]
        ],
        "travel": [
          [
            "Estación",
            "Station",
            null
          ],
          [
            "Aeropuerto",
            "Airport",
            null
          ],
          [
            "Hotel",
            "Hotel",
            null
          ]
        ]
      }
    },
    {
      "code": "de",
      "name": "German",
      "native_name": "Deutsch",
      "flag_emoji": "🇩🇪",
      "course_title": "German: your first conversations",
      "words": {
        "greetings": [
          [
            "Hallo",
            "Hello",
            null
          ],
          [
            "Auf Wiedersehen",
            "Goodbye",
            null
          ],
          [
            "Guten Morgen",
            "Good morning",
            null
          ]
        ],
        "politeness": [
          [
            "Danke",
            "Thank you",
            null
          ],
          [
            "Bitte",
            "Please",
            null
          ],
          [
            "Entschuldigung",
            "Excuse me",
            null
          ]
        ],
        "numbers": [
          [
            "Eins",
            "One",
            null
          ],
          [
            "Zwei",
            "Two",
            null
          ],
          [
            "Drei",
            "Three",
            null
          ]
        ],
        "colors": [
          [
            "Rot",
            "Red",
            null
          ],
          [
            "Blau",
            "Blue",
            null
          ],
          [
            "Grün",
            "Green",
            null
          ]
        ],
        "food": [
          [
            "Wasser",
            "Water",
            null
          ],
          [
            "Reis",
            "Rice",
            null
          ],
          [
            "Kaffee",
            "Coffee",
            null
          ]
        ],
        "travel": [
          [
            "Bahnhof",
            "Station",
            null
          ],
          [
            "Flughafen",
            "Airport",
            null
          ],
          [
            "Hotel",
            "Hotel",
            null
          ]
        ]
      }
    },
    {
      "code": "th",
      "name": "Thai",
      "native_name": "ไทย",
      "flag_emoji": "🇹🇭",
      "course_title": "Thai: your first conversations",
      "words": {
        "greetings": [
          [
            "สวัสดี",
            "Hello",
            null
          ],
          [
            "แล้วพบกัน",
            "See you later",
            null
          ],
          [
            "อรุณสวัสดิ์",
            "Good morning",
            null
          ]
        ],
        "politeness": [
          [
            "ขอบคุณ",
            "Thank you",
            null
          ],
          [
            "กรุณา",
            "Please",
            null
          ],
          [
            "ขอโทษ",
            "Excuse me",
            null
          ]
        ],
        "numbers": [
          [
            "หนึ่ง",
            "One",
            null
          ],
          [
            "สอง",
            "Two",
            null
          ],
          [
            "สาม",
            "Three",
            null
          ]
        ],
        "colors": [
          [
            "สีแดง",
            "Red",
            null
          ],
          [
            "สีน้ำเงิน",
            "Blue",
            null
          ],
          [
            "สีเขียว",
            "Green",
            null
          ]
        ],
        "food": [
          [
            "น้ำ",
            "Water",
            null
          ],
          [
            "ข้าว",
            "Rice",
            null
          ],
          [
            "กาแฟ",
            "Coffee",
            null
          ]
        ],
        "travel": [
          [
            "สถานี",
            "Station",
            null
          ],
          [
            "สนามบิน",
            "Airport",
            null
          ],
          [
            "โรงแรม",
            "Hotel",
            null
          ]
        ]
      }
    },
    {
      "code": "fr",
      "name": "French",
      "native_name": "Français",
      "flag_emoji": "🇫🇷",
      "course_title": "French: your first conversations",
      "words": {
        "greetings": [
          [
            "Bonjour",
            "Hello",
            null
          ],
          [
            "Au revoir",
            "Goodbye",
            null
          ],
          [
            "Bonsoir",
            "Good evening",
            null
          ]
        ],
        "politeness": [
          [
            "Merci",
            "Thank you",
            null
          ],
          [
            "S'il vous plaît",
            "Please",
            null
          ],
          [
            "Excusez-moi",
            "Excuse me",
            null
          ]
        ],
        "numbers": [
          [
            "Un",
            "One",
            null
          ],
          [
            "Deux",
            "Two",
            null
          ],
          [
            "Trois",
            "Three",
            null
          ]
        ],
        "colors": [
          [
            "Rouge",
            "Red",
            null
          ],
          [
            "Bleu",
            "Blue",
            null
          ],
          [
            "Vert",
            "Green",
            null
          ]
        ],
        "food": [
          [
            "Eau",
            "Water",
            null
          ],
          [
            "Riz",
            "Rice",
            null
          ],
          [
            "Café",
            "Coffee",
            null
          ]
        ],
        "travel": [
          [
            "Gare",
            "Station",
            null
          ],
          [
            "Aéroport",
            "Airport",
            null
          ],
          [
            "Hôtel",
            "Hotel",
            null
          ]
        ]
      }
    }
  ]
}$curriculum$::jsonb;
  language_entry jsonb;
  unit_entry jsonb;
  lesson_entry jsonb;
  word_entry jsonb;
  language_uuid uuid;
  course_entry record;
  existing_unit record;
  unit_uuid uuid;
  lesson_uuid uuid;
  word_uuid uuid;
  unit_index integer;
  lesson_index integer;
  word_index integer;
begin
  -- Prevent concurrent seed executions from shifting unit orders twice.
  perform pg_advisory_xact_lock(19481005, 3);

  for language_entry in select value from jsonb_array_elements(curriculum->'languages') loop
    insert into public.languages(code, name, native_name, flag_emoji, is_active)
    values (language_entry->>'code', language_entry->>'name', language_entry->>'native_name', language_entry->>'flag_emoji', true)
    on conflict (code) do nothing;
    select id into language_uuid from public.languages where code = language_entry->>'code';

    -- Create a published entry course only when the language has none.
    if not exists (select 1 from public.courses where language_id = language_uuid and is_published) then
      insert into public.courses(id, language_id, title, description, level, is_published)
      values (md5('acelingua:starter:v1:' || language_uuid::text || ':course')::uuid,
        language_uuid, language_entry->>'course_title',
        'Learn everyday ' || (language_entry->>'name') || ' through greetings, polite expressions, numbers, colors, food, and travel.',
        'beginner', true)
      on conflict (id) do nothing;
    end if;

    for course_entry in select id from public.courses where language_id = language_uuid loop
      -- Move pre-existing units after the starter curriculum once. Their IDs,
      -- content, publication state, and learners' completion records survive.
      if not exists (
        select 1 from public.units
        where course_id = course_entry.id and id in (
          select md5('acelingua:starter:v1:' || course_entry.id::text || ':unit:' || n::text)::uuid
          from generate_series(1, 3) n
        )
      ) then
        -- Move the highest order first so the immediate unique constraint on
        -- (course_id, unit_order) never sees a temporarily occupied target.
        for existing_unit in
          select id, unit_order from public.units
          where course_id = course_entry.id
          order by unit_order desc
        loop
          update public.units set unit_order = existing_unit.unit_order + 3
          where id = existing_unit.id and course_id = course_entry.id;
        end loop;
      end if;

      unit_index := 0;
      for unit_entry in select value from jsonb_array_elements(curriculum->'units') loop
        unit_index := unit_index + 1;
        unit_uuid := md5('acelingua:starter:v1:' || course_entry.id::text || ':unit:' || unit_index::text)::uuid;
        insert into public.units(id, course_id, title, description, unit_order, is_published)
        values (unit_uuid, course_entry.id, (language_entry->>'name') || ': ' || (unit_entry->>'title'),
          unit_entry->>'description', unit_index, true)
        on conflict (id) do nothing;

        lesson_index := 0;
        for lesson_entry in select value from jsonb_array_elements(unit_entry->'lessons') loop
          lesson_index := lesson_index + 1;
          lesson_uuid := md5('acelingua:starter:v1:' || course_entry.id::text || ':lesson:' || (lesson_entry->>'key'))::uuid;
          insert into public.lessons(id, unit_id, title, description, lesson_order, is_published)
          values (lesson_uuid, unit_uuid, (language_entry->>'name') || ': ' || (lesson_entry->>'title'),
            lesson_entry->>'description', lesson_index, true)
          on conflict (id) do nothing;

          word_index := 0;
          for word_entry in select value from jsonb_array_elements(language_entry->'words'->(lesson_entry->>'key')) loop
            word_index := word_index + 1;
            word_uuid := md5('acelingua:starter:v1:' || lesson_uuid::text || ':word:' || word_index::text)::uuid;
            insert into public.vocabulary(id, lesson_id, word, translation, pronunciation, created_at)
            values (word_uuid, lesson_uuid, word_entry->>0, word_entry->>1, word_entry->>2,
              now() + make_interval(secs => word_index))
            on conflict (id) do nothing;
          end loop;
        end loop;
      end loop;
    end loop;
  end loop;
end;
$seed$;

-- Refresh existing progress summaries without resetting completed lessons.
update public.course_progress cp
set total_lessons = totals.total,
    completed_lessons = totals.completed,
    progress_percentage = case when totals.total = 0 then 0
      else totals.completed::numeric / totals.total * 100 end,
    updated_at = now()
from (
  select existing.id, count(distinct lesson.id)::integer as total,
    count(distinct lesson.id) filter (where progress.status = 'completed')::integer as completed
  from public.course_progress existing
  join public.courses course on course.id = existing.course_id
  join public.languages lang on lang.id = course.language_id
  left join public.units unit on unit.course_id = course.id and unit.is_published
  left join public.lessons lesson on lesson.unit_id = unit.id and lesson.is_published
  left join public.lesson_progress progress on progress.lesson_id = lesson.id and progress.user_id = existing.user_id
  where lang.code in ('ja', 'ko', 'zh', 'es', 'de', 'th', 'fr')
  group by existing.id
) totals
where cp.id = totals.id;

commit;
