import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { WebSocketServer, WebSocket } from 'ws';
import { createPlayer, createState, publicSnapshot, step, type SimState } from '../../../packages/shared/src/simulation';
import type { CharacterId, TeamId } from '../../../packages/shared/src/index';

export const inputSchema=z.object({seq:z.number().int().nonnegative(),moveX:z.number().min(-1).max(1),jump:z.boolean(),crouch:z.boolean(),aimAngle:z.number().finite(),fire:z.boolean(),block:z.boolean(),ability:z.boolean(),dash:z.boolean()});
export function validateInput(value:unknown){return inputSchema.safeParse(value)}
export const joinSchema=z.object({type:z.literal('join'),roomCode:z.string().regex(/^[A-Z0-9-]{3,12}$/),name:z.string().trim().min(1).max(20),character:z.string().min(3).max(16)});
export const inputMessageSchema=z.object({type:z.literal('input'),input:inputSchema});
export type RoomClient={socket:WebSocket;playerId:string};
export class Room { readonly code:string; readonly state:SimState=createState(); readonly clients=new Map<string,RoomClient>(); private matchId?:string; constructor(code:string){this.code=code}
 join(socket:WebSocket,name:string,character:CharacterId){if(this.clients.size>=4){socket.send(JSON.stringify({type:'error',message:'Room is full'}));socket.close();return}const slot=this.clients.size;const team:TeamId=slot%2===0?'red':'blue';const id=`${team}-${slot+1}`;this.state.players[id]=createPlayer(id,name,team,character,Math.floor(slot/2));this.clients.set(id,{socket,playerId:id});socket.send(JSON.stringify({type:'joined',playerId:id,roomCode:this.code,team,phase:this.state.phase}));this.broadcast({type:'snapshot',snapshot:publicSnapshot(this.state)});if(this.clients.size===4){this.state.phase='warmup';this.broadcast({type:'phase',phase:'warmup'})}}
 leave(playerId:string){delete this.state.players[playerId];this.clients.delete(playerId)}
 input(playerId:string,input:unknown){const result=inputSchema.safeParse(input);if(result.success&&this.state.players[playerId]){const current=this.state.players[playerId];if(result.data.seq>=current.input.seq)current.input=result.data}}
 tick(){step(this.state);if(this.state.tick%3===0)this.broadcast({type:'snapshot',snapshot:publicSnapshot(this.state)});if(this.state.tick%30===0&&this.matchId)appendMatchEvent(this.matchId,this.state.tick,'snapshot',{players:Object.values(this.state.players).map(p=>({id:p.id,x:p.x,y:p.y,health:p.health,kills:p.kills}))}).catch(()=>undefined)}
 broadcast(payload:unknown){const encoded=JSON.stringify(payload);for(const c of this.clients.values())if(c.socket.readyState===WebSocket.OPEN)c.socket.send(encoded)}
}
const rooms=new Map<string,Room>();export function getRoom(code:string){let room=rooms.get(code);if(!room){room=new Room(code);rooms.set(code,room)}return room}
const supabaseUrl=process.env.SUPABASE_URL||'https://ktophzsjvpvcvujqymqw.supabase.co';const supabaseKey=process.env.SUPABASE_SERVICE_ROLE_KEY;const supabase=supabaseKey?createClient(supabaseUrl,supabaseKey):null;
async function appendMatchEvent(matchId:string,tick:number,eventType:string,payload:Record<string,unknown>){if(!supabase)return;await supabase.from('match_events').insert({match_id:matchId,tick,event_type:eventType,payload})}
const server=createServer((_req:IncomingMessage,res:ServerResponse)=>{res.writeHead(200,{'content-type':'application/json','access-control-allow-origin':'*'});res.end(JSON.stringify({service:'pixel-arena-authoritative-server',status:'ready',tickRate:30,rooms:[...rooms.keys()]}))});
const wss=new WebSocketServer({server,path:'/ws'});wss.on('connection',(socket)=>{let room:Room|undefined;let playerId='';socket.on('message',(raw)=>{try{const message=JSON.parse(raw.toString());if(message.type==='join'){const join=joinSchema.parse(message);room=getRoom(join.roomCode);playerId=room['clients'].size===4?'':`pending`;room.join(socket,join.name,join.character as CharacterId);const joined=[...room.clients.values()].find(c=>c.socket===socket);if(joined)playerId=joined.playerId}else if(message.type==='input'&&room&&playerId){const input=inputMessageSchema.parse(message);room.input(playerId,input.input)}}catch(error){socket.send(JSON.stringify({type:'error',message:error instanceof Error?error.message:'Invalid message'}))}});socket.on('close',()=>{if(room&&playerId)room.leave(playerId)})});
setInterval(()=>{for(const room of rooms.values())room.tick()},1000/30);
if(process.env.NODE_ENV!=='test')server.listen(Number(process.env.PORT||8787),'0.0.0.0',()=>console.log('Pixel Arena authoritative server listening on 8787'));
