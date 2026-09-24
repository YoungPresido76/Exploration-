import {describe,expect,it} from 'vitest';
import {validateInput} from '../apps/server/src/index';

describe('authoritative input validation',()=>{
 it('accepts a normalized movement command',()=>expect(validateInput({seq:1,moveX:1,jump:false,crouch:false,aimAngle:0,fire:true,block:false,ability:false,dash:false}).success).toBe(true));
 it('rejects impossible movement values',()=>expect(validateInput({seq:1,moveX:4,jump:false,crouch:false,aimAngle:0,fire:true,block:false,ability:false,dash:false}).success).toBe(false));
});
