// ทดสอบเกณฑ์ FPS ≥ 25 ของบทความ (หัวข้อ 6.2)   วิธีรัน: node tests/fps-target.test.mjs
import assert from 'node:assert/strict';
import { FPS_TARGET, fpsPass, fpsVerdict } from '../js/fps-target.js';

assert.equal(FPS_TARGET, 25);
assert.ok(fpsPass(25) && fpsPass(30.2) && !fpsPass(24.9) && !fpsPass(undefined));
let v = fpsVerdict({ camera: { avgFps: 30 }, face: { avgFps: 26 }, game: { skipped: true } });
assert.ok(v.pass && v.tested === 2 && v.passed === 2);
v = fpsVerdict({ camera: { avgFps: 30 }, game: { avgFps: 18 } });
assert.ok(!v.pass && v.failed[0] === 'game' && v.passed === 1);
assert.equal(fpsVerdict({}).pass, false);
console.log('ผ่าน 5 ข้อ (FPS ≥ 25 PASS/FAIL ต่อสถานการณ์และภาพรวม)');
