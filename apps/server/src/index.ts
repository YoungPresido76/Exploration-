import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';

const inputSchema=z.object({seq:z.number().int().nonnegative(),moveX:z.number().min(-1).max(1),jump:z.boolean(),crouch:z.boolean(),aimAngle:z.number().finite(),fire:z.boolean(),block:z.boolean(),ability:z.boolean(),dash:z.boolean()});
const supabaseUrl=process.env.SUPABASE_URL||'https://ktophzsjvpvcvujqymqw.supabase.co';
const supabaseKey=process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase=supabaseKey?createClient(supabaseUrl,supabaseKey):null;

export function validateInput(value:unknown){return inputSchema.safeParse(value)}
export async function appendMatchEvent(matchId:string,tick:number,eventType:string,payload:Record<string,unknown>){if(!supabase)return {skipped:true};const {error}=await supabase.from('match_events').insert({match_id:matchId,tick,event_type:eventType,payload});if(error)throw error;return {skipped:false}}

const server=createServer((_req:IncomingMessage,res:ServerResponse)=>{res.writeHead(200,{'content-type':'application/json'});res.end(JSON.stringify({service:'pixel-arena-authoritative-server',status:'ready',tickRate:30,roomModel:'2v2'}))});
if(process.env.NODE_ENV!=='test')server.listen(Number(process.env.PORT||8787),'0.0.0.0',()=>console.log('Pixel Arena server listening on 8787'));
