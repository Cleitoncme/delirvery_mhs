export interface Tenant { id: string; slug: string; name: string; primaryColor: string; isOpen: boolean; openingHoursLabel: string; opensAt?: string; deliveryFee: number }
export interface Category { id: string; tenantId: string; name: string; slug: string; icon: string }
export interface ProductOption { id: string; name: string; additionalPrice: number }
export interface ProductOptionGroup { id: string; name: string; required: boolean; min: number; max: number; options: ProductOption[] }
export interface Product { id: string; tenantId: string; externalId?: string; categoryId: string; subcategory: string; name: string; description: string; price: number; compareAtPrice?: number; unit: string; available: boolean; featured: boolean; illustration: string; configurable?: boolean; optionGroups?: ProductOptionGroup[] }
export interface CartLine { productId: string; quantity: number; optionIds: string[] }
export interface CartItem extends CartLine { id: string; productName: string; unitPrice: number; total: number; selectedOptions: ProductOption[] }
export interface Address { street: string; number: string; complement?: string; neighborhood: string; city: string; state: string; zipCode: string; reference?: string }
export interface Customer { id: string; name: string; phone: string; email?: string }
export type DeliveryOrderStatus = "NEW" | "PREPARING" | "READY" | "OUT_FOR_DELIVERY" | "COMPLETED" | "CANCELED";
export type FulfillmentType = "DELIVERY" | "PICKUP";
export type PaymentMethod = "PIX" | "CARD_ON_DELIVERY" | "CASH";
export interface Order { id: string; tenantId: string; number: string; customer: Customer; items: CartItem[]; address?: Address; fulfillmentType: FulfillmentType; paymentMethod: PaymentMethod; changeFor?: number; notes: string; subtotal: number; deliveryFee: number; discount: number; total: number; status: DeliveryOrderStatus; createdAt: string; history: { status: DeliveryOrderStatus; at: string }[] }
