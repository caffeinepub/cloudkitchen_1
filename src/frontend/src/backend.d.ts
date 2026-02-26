import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface InventoryItem {
    id: bigint;
    lowStockThreshold: number;
    name: string;
    unit: string;
    quantity: number;
}
export interface MenuItem {
    id: bigint;
    name: string;
    isAvailable: boolean;
    description: string;
    imageUrl: string;
    category: string;
    price: number;
}
export type Time = bigint;
export interface DailyStats {
    revenue: number;
    date: Time;
    orderCount: bigint;
}
export interface TopSellingItem {
    menuItemName: string;
    totalQuantity: bigint;
    menuItemId: bigint;
}
export interface OrderItem {
    quantity: bigint;
    unitPrice: number;
    menuItemId: bigint;
}
export interface Order {
    id: bigint;
    customerName: string;
    status: OrderStatus;
    customerPhone: string;
    createdAt: Time;
    totalAmount: number;
    notes: string;
    customerId: Principal;
    items: Array<OrderItem>;
}
export interface UserProfile {
    name: string;
    phone: string;
}
export enum OrderStatus {
    new_ = "new",
    preparing = "preparing",
    cancelled = "cancelled",
    delivered = "delivered",
    ready = "ready"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createInventoryItem(name: string, unit: string, quantity: number, lowStockThreshold: number): Promise<InventoryItem>;
    createMenuItem(name: string, description: string, price: number, category: string, imageUrl: string): Promise<MenuItem>;
    deleteInventoryItem(id: bigint): Promise<void>;
    deleteMenuItem(id: bigint): Promise<void>;
    getAllOrders(): Promise<Array<Order>>;
    getAvailableMenuItems(): Promise<Array<MenuItem>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getDailyBreakdown(startTime: Time, endTime: Time): Promise<Array<DailyStats>>;
    getLowStockItems(): Promise<Array<InventoryItem>>;
    getOrder(orderId: bigint): Promise<Order>;
    getOrdersByStatus(status: OrderStatus): Promise<Array<Order>>;
    getRevenueAndOrderCount(startTime: Time, endTime: Time): Promise<{
        revenue: number;
        orderCount: bigint;
    }>;
    getTopSellingItems(limit: bigint): Promise<Array<TopSellingItem>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    placeOrder(customerName: string, customerPhone: string, items: Array<OrderItem>, notes: string): Promise<Order>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    toggleMenuItemAvailability(id: bigint): Promise<MenuItem>;
    updateInventoryItem(id: bigint, name: string, unit: string, quantity: number, lowStockThreshold: number): Promise<InventoryItem>;
    updateMenuItem(id: bigint, name: string, description: string, price: number, category: string, imageUrl: string): Promise<MenuItem>;
    updateOrderStatus(orderId: bigint, status: OrderStatus): Promise<Order>;
    updateStockLevel(id: bigint, quantity: number): Promise<InventoryItem>;
}
