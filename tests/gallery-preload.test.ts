import test from 'node:test';
import assert from 'node:assert/strict';
import { nearbyMedia } from '../app/gallery-preload.ts';
const bounds = Array.from({length:12}, (_,index)=>({left:index*100,right:(index+1)*100}));
void test('preloads visible media and exactly two upcoming items',()=>{
 assert.deepEqual(nearbyMedia(bounds,{left:0,right:200},6,1),[0,1,2,3]);
 assert.deepEqual(nearbyMedia(bounds,{left:200,right:300},6,-1),[2,1,0]);
});
void test('preload window crosses the carousel loop without duplicate requests',()=>{
 assert.deepEqual(nearbyMedia(bounds,{left:500,right:700},6,1),[5,0,1,2]);
 assert.deepEqual(nearbyMedia(bounds,{left:0,right:100},6,-1),[0,5,4]);
 assert.deepEqual(nearbyMedia([],{left:0,right:100},0,1),[]);
});
