import assert from 'node:assert/strict';
import fs from 'node:fs';
import {PGlite} from '../.tmp-country-sql/node_modules/@electric-sql/pglite/dist/index.js';
const db=new PGlite();
try {
 await db.exec(`create role anon;create role authenticated;create table profiles(id int primary key,xp int not null default 0,level int not null default 1);insert into profiles values(1,250,1),(2,50,5);`);
 await db.exec(fs.readFileSync(new URL('../supabase/proposals/202610200004_xp_levels.sql',import.meta.url),'utf8'));
 const level=async id=>(await db.query('select level from profiles where id=$1',[id])).rows[0].level;
 assert.equal(await level(1),3);assert.equal(await level(2),5);
 await db.exec('update profiles set xp=xp+50 where id=1');assert.equal(await level(1),4);
 await db.exec('insert into profiles values(3,99,1)');assert.equal(await level(3),1);
 await db.exec('update profiles set xp=100 where id=3');assert.equal(await level(3),2);
 await db.exec('update profiles set xp=10 where id=2');assert.equal(await level(2),5);
 await db.exec('begin;update profiles set xp=1000 where id=3;rollback;');assert.equal(await level(3),2);
 console.log('XP level integration passed: initial synchronization, exact thresholds, all profile XP updates, preserved historical levels, and rollback.');
}finally{await db.close();}
