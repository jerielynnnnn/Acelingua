export type Quest = {id:string;definition_id:string;title:string;description:string;cadence:"daily"|"weekly";target:number;progress:number;reward_xp:number;reward_coins:number;reward_gems:number;claimed:boolean};
export type QuestSnapshot={server_now:string;today:string;timezone:string;resets_at:string;weekly_resets_at:string;profile:{xp:number;coins:number;gems:number};quests:Quest[];chest:{xp:number;coins:number;gems:number;required:number;claimed_count:number;claimed:boolean}};
export type QuestReward={xp:number;coins:number;gems:number;already_claimed:boolean};
function record(value:unknown):value is Record<string,unknown>{return Boolean(value)&&typeof value==="object"&&!Array.isArray(value);}
function integer(value:unknown):value is number{return typeof value==="number"&&Number.isSafeInteger(value)&&value>=0;}
function timestamp(value:unknown):value is string{return typeof value==="string"&&Number.isFinite(Date.parse(value));}
export function parseQuestSnapshot(value:unknown):QuestSnapshot{
 if(!record(value)||!timestamp(value.server_now)||!timestamp(value.resets_at)||!timestamp(value.weekly_resets_at)||typeof value.today!=="string"||typeof value.timezone!=="string"||!record(value.profile)||![value.profile.xp,value.profile.coins,value.profile.gems].every(integer)||!Array.isArray(value.quests)||!record(value.chest))throw new Error("Quest progress could not be confirmed. Please retry.");
 const chest=value.chest;
 if(![chest.xp,chest.coins,chest.gems,chest.required,chest.claimed_count].every(integer)||chest.required===0||typeof chest.claimed!=="boolean")throw new Error("Treasure chest progress could not be confirmed.");
 for(const quest of value.quests){if(!record(quest)||typeof quest.id!=="string"||typeof quest.definition_id!=="string"||typeof quest.title!=="string"||typeof quest.description!=="string"||!["daily","weekly"].includes(String(quest.cadence))||![quest.target,quest.progress,quest.reward_xp,quest.reward_coins,quest.reward_gems].every(integer)||quest.target===0||typeof quest.claimed!=="boolean")throw new Error("A quest could not be loaded. Please retry.");}
 if(new Set(value.quests.map(q=>q.id)).size!==value.quests.length)throw new Error("Duplicate quest records received. Please retry.");
 return value as unknown as QuestSnapshot;
}
export function parseQuestReward(value:unknown):QuestReward{
 if(!record(value)||![value.xp,value.coins,value.gems].every(integer)||typeof value.already_claimed!=="boolean")throw new Error("Your reward could not be confirmed. Refresh your quests before trying again.");
 return value as unknown as QuestReward;
}
export function questSummary(data:QuestSnapshot){const daily=data.quests.filter(q=>q.cadence==="daily");return {total:daily.length,completed:daily.filter(q=>q.progress>=q.target).length,ready:daily.filter(q=>!q.claimed&&q.progress>=q.target).length,claimed:daily.filter(q=>q.claimed).length,chestReady:!data.chest.claimed&&daily.length===data.chest.required&&daily.every(q=>q.claimed)};}
export function countdown(ms:number){const seconds=Math.max(0,Math.ceil(ms/1000));return `${String(Math.floor(seconds/3600)).padStart(2,"0")}:${String(Math.floor(seconds/60)%60).padStart(2,"0")}:${String(seconds%60).padStart(2,"0")}`;}
