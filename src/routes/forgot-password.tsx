import { createFileRoute, redirect } from '@tanstack/react-router';
export const Route=createFileRoute('/forgot-password')({beforeLoad:()=>{throw redirect({to:'/our-work'});},component:()=>null});