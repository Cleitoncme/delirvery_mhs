"use client";
import { create } from "zustand";
import type { Order } from "@/types/domain";

const seed: Order[] = [{ id:"demo-10254",tenantId:"mhs",number:"10254",customer:{id:"demo-customer",name:"João da Silva",phone:"(49) 99999-9999",email:"joao@exemplo.com"},items:[],address:{street:"Rua das Flores",number:"123",neighborhood:"Centro",city:"Chapecó",state:"SC",zipCode:"89801-000"},fulfillmentType:"DELIVERY",paymentMethod:"PIX",notes:"",subtotal:5178,deliveryFee:500,discount:0,total:5678,status:"PREPARING",createdAt:"2026-09-11T14:32:00-03:00",history:[{status:"NEW",at:"2026-09-11T14:32:00-03:00"},{status:"PREPARING",at:"2026-09-11T14:35:00-03:00"}] }];
interface OrderState { orders: Order[]; create:(order:Order)=>void; transition:(id:string,status:Order["status"])=>void; get:(id:string)=>Order|undefined; }
export const useOrders = create<OrderState>()((set,get)=>({
  orders:seed,
  create: order => set({orders:[order,...get().orders]}),
  transition:(id,status)=>set({orders:get().orders.map(order=>order.id===id?{...order,status,history:[...order.history,{status,at:new Date().toISOString()}]}:order)}),
  get:id=>get().orders.find(order=>order.id===id),
}));
