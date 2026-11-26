import { createFileRoute, redirect } from '@tanstack/react-router';
export const Route=createFileRoute('/product/$productId')({beforeLoad:()=>{throw redirect({to:'/our-work'});},component:()=>null});