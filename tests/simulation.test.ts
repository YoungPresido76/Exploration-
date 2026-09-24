import {describe,expect,it} from 'vitest';
import {createPlayer,createState,step,terrainIndex,WORLD} from '../packages/shared/src/simulation';

describe('authoritative simulation',()=>{
 it('starts a 4x4 terrain grid with solid floor and cover',()=>{const state=createState();expect(state.terrain.length).toBe((WORLD.width/WORLD.cell)*(WORLD.height/WORLD.cell));expect(state.terrain[terrainIndex(10,120)].hp).toBeGreaterThan(0)})
 it('moves players from validated input on the server tick',()=>{const state=createState();state.phase='live';state.players.p=createPlayer('p','Player','red','diego',0);const x=state.players.p.x;state.players.p.input.moveX=1;step(state);expect(state.players.p.x).toBeGreaterThan(x)})
 it('resolves a shot and respawns after three seconds',()=>{const state=createState();state.phase='live';const shooter=createPlayer('a','A','red','diego',0);const target=createPlayer('b','B','blue','diego',0);shooter.x=target.x-80;shooter.input.aimAngle=0;shooter.input.fire=true;target.health=20;state.players.a=shooter;state.players.b=target;step(state);expect(target.alive).toBe(false);for(let i=0;i<90;i++)step(state);expect(target.alive).toBe(true);expect(target.health).toBe(100)})
})
