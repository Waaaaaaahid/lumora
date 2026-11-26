import { createFileRoute, redirect } from '@tanstack/react-router';
export const Route=createFileRoute('/order-success')({beforeLoad:()=>{throw redirect({to:'/our-work'});},component:()=>null});