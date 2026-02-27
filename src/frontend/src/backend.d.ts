import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
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
export interface Customer {
    id: bigint;
    name: string;
    mobileNo: string;
    preferences: string;
    address: string;
}
export interface Subscription {
    id: bigint;
    customerName: string;
    status: SubscriptionStatus;
    paymentStatus: PaymentStatus;
    endDate: Time;
    customerPhone: string;
    plan: SubscriptionPlan;
    price: number;
    bowlSize: BowlSize;
    totalDeliveriesMade: bigint;
    startDate: Time;
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
export interface InventoryItem {
    id: bigint;
    lowStockThreshold: number;
    name: string;
    unit: string;
    quantity: number;
}
export interface UserProfile {
    name: string;
    phone: string;
}
export enum BowlSize {
    large = "large",
    small = "small",
    medium = "medium"
}
export enum OrderStatus {
    new_ = "new",
    preparing = "preparing",
    cancelled = "cancelled",
    delivered = "delivered",
    ready = "ready"
}
export enum PaymentStatus {
    pending = "pending",
    paid = "paid",
    overdue = "overdue"
}
export enum SubscriptionPlan {
    monthly = "monthly",
    weekly = "weekly"
}
export enum SubscriptionStatus {
    active = "active",
    cancelled = "cancelled",
    expired = "expired",
    paused = "paused"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    checkAndExpireSubscriptions(): Promise<bigint>;
    createCustomer(name: string, mobileNo: string, preferences: string, address: string): Promise<Customer>;
    createInventoryItem(name: string, unit: string, quantity: number, lowStockThreshold: number): Promise<InventoryItem>;
    createMenuItem(name: string, description: string, price: number, category: string, imageUrl: string): Promise<MenuItem>;
    createSubscription(customerName: string, customerPhone: string, plan: SubscriptionPlan, bowlSize: BowlSize, price: number): Promise<Subscription>;
    deleteCustomer(id: bigint): Promise<void>;
    deleteInventoryItem(id: bigint): Promise<void>;
    deleteMenuItem(id: bigint): Promise<void>;
    getActiveSubscriptionCount(): Promise<bigint>;
    getAllCustomers(): Promise<Array<Customer>>;
    getAllOrders(): Promise<Array<Order>>;
    getAllSubscriptions(): Promise<Array<Subscription>>;
    getAvailableMenuItems(): Promise<Array<MenuItem>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCustomer(id: bigint): Promise<Customer>;
    getDailyBreakdown(startTime: Time, endTime: Time): Promise<Array<DailyStats>>;
    getExpiringSubscriptions(): Promise<Array<Subscription>>;
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
    updateCustomer(id: bigint, name: string, mobileNo: string, preferences: string, address: string): Promise<Customer>;
    updateInventoryItem(id: bigint, name: string, unit: string, quantity: number, lowStockThreshold: number): Promise<InventoryItem>;
    updateMenuItem(id: bigint, name: string, description: string, price: number, category: string, imageUrl: string): Promise<MenuItem>;
    updateOrderStatus(orderId: bigint, status: OrderStatus): Promise<Order>;
    updateStockLevel(id: bigint, quantity: number): Promise<InventoryItem>;
    updateSubscription(id: bigint, bowlSize: BowlSize, price: number, paymentStatus: PaymentStatus): Promise<Subscription>;
    updateSubscriptionStatus(id: bigint, status: SubscriptionStatus): Promise<Subscription>;
}
