export type TeamId = 'red' | 'blue';
export type CharacterId = 'diego' | 'toggle' | 'tracy' | 'angie' | 'percy' | 'armand' | 'vessa' | 'holly' | 'gordon';
export type WeaponId = 'rifle' | 'poison_bubbles' | 'crossbow' | 'seed_cluster' | 'fireball' | 'shield' | 'drill' | 'ground_smash' | 'blade_combo';

export interface CharacterDef { id: CharacterId; name: string; role: string; maxHealth: number; moveSpeed: number; jumpVelocity: number; weapon: WeaponId; ability: string; ultimate: string; }
export interface InputCommand { seq: number; moveX: number; jump: boolean; crouch: boolean; aimAngle: number; fire: boolean; block: boolean; ability: boolean; dash: boolean; }
export interface MatchSummary { id: string; roomCode: string; phase: 'lobby'|'warmup'|'live'|'sudden_death'|'results'; arenaId: string; mode: string; }

export const CHARACTERS: CharacterDef[] = [
  {id:'diego',name:'Diego',role:'Rifleman',maxHealth:100,moveSpeed:150,jumpVelocity:330,weapon:'rifle',ability:'Suppressing Fire',ultimate:'Gravity Pinball'},
  {id:'toggle',name:'Toggle',role:'Skirmisher',maxHealth:90,moveSpeed:175,jumpVelocity:340,weapon:'poison_bubbles',ability:'Poison Cloud',ultimate:'Gravity Pinball'},
  {id:'tracy',name:'Tracy',role:'Marksman',maxHealth:95,moveSpeed:130,jumpVelocity:320,weapon:'crossbow',ability:'Ricochet Arrow',ultimate:'Gravity Pinball'},
  {id:'angie',name:'Angie',role:'Demolition',maxHealth:105,moveSpeed:135,jumpVelocity:360,weapon:'seed_cluster',ability:'Seed Cluster',ultimate:'Meteor Panic'},
  {id:'percy',name:'Percy',role:'Mage',maxHealth:95,moveSpeed:140,jumpVelocity:340,weapon:'fireball',ability:'Firewall',ultimate:'Gravity Pinball'},
  {id:'armand',name:'Armand',role:'Tank',maxHealth:135,moveSpeed:105,jumpVelocity:300,weapon:'shield',ability:'Shield Wall',ultimate:'Wormhole Swap'},
  {id:'vessa',name:'Vessa',role:'Assassin',maxHealth:85,moveSpeed:195,jumpVelocity:350,weapon:'drill',ability:'Drill Dive',ultimate:'Wormhole Swap'},
  {id:'holly',name:'Holly',role:'Bruiser',maxHealth:125,moveSpeed:120,jumpVelocity:315,weapon:'ground_smash',ability:'Ground Smash',ultimate:'Meteor Panic'},
  {id:'gordon',name:'Gordon',role:'Duelist',maxHealth:110,moveSpeed:145,jumpVelocity:325,weapon:'blade_combo',ability:'Blade Rush',ultimate:'Gravity Pinball'}
];
