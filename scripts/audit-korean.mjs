import fs from 'node:fs';
import {createClient} from '@supabase/supabase-js';
process.loadEnvFile('.env.local');
const db=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:false,autoRefreshToken:false},global:{fetch:(url,options)=>fetch(url,{...options,signal:AbortSignal.timeout(20000)})}});
const report={checkedAt:new Date().toISOString(),scope:'Anonymous catalog reads only. RLS may hide unpublished content; private learner dependencies require the companion SQL audit. No database writes.',tables:{}};
async function read(table,filter){
 const rows=[];
 const order={travel_country_languages:'country_id,language_id',travel_country_units:'country_id,unit_id',travel_unit_curriculum:'unit_id'}[table]??'id';
 for(let start=0;;start+=500){let query=db.from(table).select('*');for(const column of order.split(','))query=query.order(column);query=query.range(start,start+499);if(filter)query=query.in(filter[0],filter[1]);const {data,error}=await query;if(error){report.tables[table]={error:{code:error.code,message:error.message}};return [];}rows.push(...data);if(data.length<500)break;}
 report.tables[table]={count:rows.length,rows};return rows;
}
const languages=await read('languages',['code',['ko']]);
const courses=await read('courses',['language_id',languages.map(r=>r.id)]);
const units=await read('units',['course_id',courses.map(r=>r.id)]);
const lessons=await read('lessons',['unit_id',units.map(r=>r.id)]);
const systems=await read('writing_systems',['language_id',languages.map(r=>r.id)]);
const writing=await read('writing_studio_lessons',['language_id',languages.map(r=>r.id)]);
const activities=await read('activities',['lesson_id',lessons.map(r=>r.id)]);
await Promise.all([
 read('vocabulary',['lesson_id',lessons.map(r=>r.id)]),read('questions',['activity_id',activities.map(r=>r.id)]),
 read('writing_characters',['writing_system_id',systems.map(r=>r.id)]),read('writing_studio_activities',['lesson_id',writing.map(r=>r.id)]),
 ...['travel_countries','travel_country_languages','travel_country_units','travel_unit_curriculum'].map(table=>read(table)),
]);
fs.writeFileSync('supabase/korean-audit.json',JSON.stringify(report,null,2)+'\n');
for(const [table,value]of Object.entries(report.tables))console.log(`${table}: ${value.error?value.error.code+' '+value.error.message:value.count}`);
console.log(JSON.stringify({courses,units:units.map(u=>({id:u.id,title:u.title,order:u.unit_order,lessons:lessons.filter(l=>l.unit_id===u.id).length}))},null,2));
