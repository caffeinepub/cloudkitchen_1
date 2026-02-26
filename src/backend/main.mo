import Iter "mo:core/Iter";
import Order "mo:core/Order";
import Array "mo:core/Array";
import Map "mo:core/Map";
import Time "mo:core/Time";
import Runtime "mo:core/Runtime";
import Nat "mo:core/Nat";
import Float "mo:core/Float";
import Int "mo:core/Int";
import Principal "mo:core/Principal";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";

actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  public type UserProfile = {
    name : Text;
    phone : Text;
  };

  type MenuItem = {
    id : Nat;
    name : Text;
    description : Text;
    price : Float;
    category : Text;
    imageUrl : Text;
    isAvailable : Bool;
  };

  type OrderItem = {
    menuItemId : Nat;
    quantity : Nat;
    unitPrice : Float;
  };

  type OrderStatus = { #new; #preparing; #ready; #delivered; #cancelled };

  type Order = {
    id : Nat;
    customerName : Text;
    customerPhone : Text;
    items : [OrderItem];
    totalAmount : Float;
    status : OrderStatus;
    createdAt : Time.Time;
    notes : Text;
    customerId : Principal;
  };

  type InventoryItem = {
    id : Nat;
    name : Text;
    unit : Text;
    quantity : Float;
    lowStockThreshold : Float;
  };

  type DailyStats = {
    date : Time.Time;
    orderCount : Nat;
    revenue : Float;
  };

  type TopSellingItem = {
    menuItemId : Nat;
    menuItemName : Text;
    totalQuantity : Nat;
  };

  let userProfiles = Map.empty<Principal, UserProfile>();
  let menuItems = Map.empty<Nat, MenuItem>();
  let orders = Map.empty<Nat, Order>();
  let inventory = Map.empty<Nat, InventoryItem>();

  var nextMenuItemId = 1;
  var nextOrderId = 1;
  var nextInventoryItemId = 1;

  // -------------------------------
  // User Profile Management
  // -------------------------------

  // Only check for anonymous, no role check (allows new users to bootstrap)
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Anonymous users cannot have profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  // Only check for anonymous, no role check (allows new users to bootstrap)
  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Anonymous users cannot save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // -------------------------------
  // Menu Management
  // -------------------------------

  module MenuItem {
    public func compare(menuItem1 : MenuItem, menuItem2 : MenuItem) : Order.Order {
      Nat.compare(menuItem1.id, menuItem2.id);
    };
  };

  // Create Menu Item (Admin only)
  public shared ({ caller }) func createMenuItem(
    name : Text,
    description : Text,
    price : Float,
    category : Text,
    imageUrl : Text,
  ) : async MenuItem {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };

    let item : MenuItem = {
      id = nextMenuItemId;
      name;
      description;
      price;
      category;
      imageUrl;
      isAvailable = true;
    };

    menuItems.add(nextMenuItemId, item);
    nextMenuItemId += 1;
    item;
  };

  // Update Menu Item (Admin only)
  public shared ({ caller }) func updateMenuItem(
    id : Nat,
    name : Text,
    description : Text,
    price : Float,
    category : Text,
    imageUrl : Text,
  ) : async MenuItem {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };

    switch (menuItems.get(id)) {
      case (null) { Runtime.trap("Menu item not found") };
      case (?existing) {
        let updated : MenuItem = {
          id;
          name;
          description;
          price;
          category;
          imageUrl;
          isAvailable = existing.isAvailable;
        };
        menuItems.add(id, updated);
        updated;
      };
    };
  };

  // Delete Menu Item (Admin only)
  public shared ({ caller }) func deleteMenuItem(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };

    if (not menuItems.containsKey(id)) {
      Runtime.trap("Menu item not found");
    };
    menuItems.remove(id);
  };

  // Toggle Menu Item Availability (Admin only)
  public shared ({ caller }) func toggleMenuItemAvailability(id : Nat) : async MenuItem {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };

    switch (menuItems.get(id)) {
      case (null) { Runtime.trap("Menu item not found") };
      case (?existing) {
        let updated : MenuItem = {
          id = existing.id;
          name = existing.name;
          description = existing.description;
          price = existing.price;
          category = existing.category;
          imageUrl = existing.imageUrl;
          isAvailable = not existing.isAvailable;
        };
        menuItems.add(id, updated);
        updated;
      };
    };
  };

  // Get All Available Menu Items (Public - for customers)
  public query func getAvailableMenuItems() : async [MenuItem] {
    menuItems.values().toArray().filter(
      func(m) { m.isAvailable }
    );
  };

  // -------------------------------
  // Order Management
  // -------------------------------

  // Get Order (Admin or order owner only)
  public query ({ caller }) func getOrder(orderId : Nat) : async Order {
    switch (orders.get(orderId)) {
      case (null) { Runtime.trap("Order does not exist") };
      case (?order) {
        // Only admin or the customer who placed the order can view it
        if (caller != order.customerId and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only view your own orders");
        };
        order;
      };
    };
  };

  // Place Order (Public - for customers)
  public shared ({ caller }) func placeOrder(
    customerName : Text,
    customerPhone : Text,
    items : [OrderItem],
    notes : Text,
  ) : async Order {
    if (items.size() == 0) {
      Runtime.trap("Order must have at least one item");
    };

    var total = 0.0;

    // Validate items and calculate total
    for (item in items.values()) {
      switch (menuItems.get(item.menuItemId)) {
        case (null) { Runtime.trap("Menu item not found: " # item.menuItemId.toText()) };
        case (?menuItem) {
          if (not menuItem.isAvailable) {
            Runtime.trap("Menu item not available: " # menuItem.name);
          };
          total += item.unitPrice * Int.fromNat(item.quantity).toFloat();
        };
      };
    };

    let order : Order = {
      id = nextOrderId;
      customerName;
      customerPhone;
      items;
      totalAmount = total;
      status = #new;
      createdAt = Time.now();
      notes;
      customerId = caller;
    };

    orders.add(nextOrderId, order);
    nextOrderId += 1;
    order;
  };

  // Update Order Status (Admin only)
  public shared ({ caller }) func updateOrderStatus(orderId : Nat, status : OrderStatus) : async Order {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };

    switch (orders.get(orderId)) {
      case (null) { Runtime.trap("Order not found") };
      case (?existing) {
        let updated : Order = {
          id = existing.id;
          customerName = existing.customerName;
          customerPhone = existing.customerPhone;
          items = existing.items;
          totalAmount = existing.totalAmount;
          status;
          createdAt = existing.createdAt;
          notes = existing.notes;
          customerId = existing.customerId;
        };
        orders.add(orderId, updated);
        updated;
      };
    };
  };

  // Get Orders by Status (Admin only)
  public query ({ caller }) func getOrdersByStatus(status : OrderStatus) : async [Order] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };

    orders.values().toArray().filter(
      func(o) { o.status == status }
    );
  };

  // Get All Orders (Admin only)
  public query ({ caller }) func getAllOrders() : async [Order] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };

    orders.values().toArray();
  };

  // -------------------------------
  // Inventory Management
  // -------------------------------
  module InventoryItem {
    public func compare(inventoryItem1 : InventoryItem, inventoryItem2 : InventoryItem) : Order.Order {
      Float.compare(inventoryItem1.quantity, inventoryItem2.quantity);
    };
  };

  // Create Inventory Item (Admin only)
  public shared ({ caller }) func createInventoryItem(
    name : Text,
    unit : Text,
    quantity : Float,
    lowStockThreshold : Float,
  ) : async InventoryItem {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };

    let item : InventoryItem = {
      id = nextInventoryItemId;
      name;
      unit;
      quantity;
      lowStockThreshold;
    };

    inventory.add(nextInventoryItemId, item);
    nextInventoryItemId += 1;
    item;
  };

  // Update Inventory Item (Admin only)
  public shared ({ caller }) func updateInventoryItem(
    id : Nat,
    name : Text,
    unit : Text,
    quantity : Float,
    lowStockThreshold : Float,
  ) : async InventoryItem {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };

    switch (inventory.get(id)) {
      case (null) { Runtime.trap("Inventory item not found") };
      case (?_) {
        let updated : InventoryItem = {
          id;
          name;
          unit;
          quantity;
          lowStockThreshold;
        };
        inventory.add(id, updated);
        updated;
      };
    };
  };

  // Delete Inventory Item (Admin only)
  public shared ({ caller }) func deleteInventoryItem(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };

    if (not inventory.containsKey(id)) {
      Runtime.trap("Inventory item not found");
    };
    inventory.remove(id);
  };

  // Update Stock Level (Admin only)
  public shared ({ caller }) func updateStockLevel(id : Nat, quantity : Float) : async InventoryItem {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };

    switch (inventory.get(id)) {
      case (null) { Runtime.trap("Inventory item not found") };
      case (?existing) {
        let updated : InventoryItem = {
          id = existing.id;
          name = existing.name;
          unit = existing.unit;
          quantity;
          lowStockThreshold = existing.lowStockThreshold;
        };
        inventory.add(id, updated);
        updated;
      };
    };
  };

  // Get Low Stock Items (Admin only)
  public query ({ caller }) func getLowStockItems() : async [InventoryItem] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };

    let lowStockItems = inventory.values().toArray().filter(
      func(item) { item.quantity < item.lowStockThreshold }
    );
    lowStockItems.sort();
  };

  // -------------------------------
  // Analytics
  // -------------------------------

  // Get Total Revenue and Order Count (Admin only)
  public query ({ caller }) func getRevenueAndOrderCount(startTime : Time.Time, endTime : Time.Time) : async { revenue : Float; orderCount : Nat } {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };

    var revenue = 0.0;
    var orderCount = 0;

    for (order in orders.values()) {
      if (order.createdAt >= startTime and order.createdAt <= endTime and order.status != #cancelled) {
        revenue += order.totalAmount;
        orderCount += 1;
      };
    };

    { revenue; orderCount };
  };

  // Get Top Selling Menu Items (Admin only)
  public query ({ caller }) func getTopSellingItems(limit : Nat) : async [TopSellingItem] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };

    let itemQuantities = Map.empty<Nat, Nat>();

    // Aggregate quantities for each menu item
    for (order in orders.values()) {
      if (order.status != #cancelled) {
        for (item in order.items.values()) {
          let currentQty = switch (itemQuantities.get(item.menuItemId)) {
            case (null) { 0 };
            case (?qty) { qty };
          };
          itemQuantities.add(item.menuItemId, currentQty + item.quantity);
        };
      };
    };

    // Convert to array and sort
    let itemsArray = itemQuantities.entries().toArray().map(
      func((menuItemId, totalQuantity)) {
        let menuItemName = switch (menuItems.get(menuItemId)) {
          case (null) { "Unknown" };
          case (?item) { item.name };
        };
        { menuItemId; menuItemName; totalQuantity };
      },
    );

    let sorted = itemsArray.sort(func(a, b) { Nat.compare(b.totalQuantity, a.totalQuantity) });

    if (limit >= sorted.size()) {
      sorted;
    } else {
      sorted.sliceToArray(0, limit);
    };
  };

  // Get Daily Order and Revenue Breakdown (Admin only)
  public query ({ caller }) func getDailyBreakdown(startTime : Time.Time, endTime : Time.Time) : async [DailyStats] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };

    let dayInNanos : Int = 86_400_000_000_000; // 24 hours in nanoseconds
    let dailyStats = Map.empty<Int, { var orderCount : Nat; var revenue : Float }>();

    for (order in orders.values()) {
      if (order.createdAt >= startTime and order.createdAt <= endTime and order.status != #cancelled) {
        let dayStart = (order.createdAt / dayInNanos) * dayInNanos;

        switch (dailyStats.get(dayStart)) {
          case (null) {
            dailyStats.add(dayStart, { var orderCount = 1; var revenue = order.totalAmount });
          };
          case (?stats) {
            stats.orderCount += 1;
            stats.revenue += order.totalAmount;
          };
        };
      };
    };

    let result = dailyStats.entries().toArray().map(
      func((date, stats)) {
        { date; orderCount = stats.orderCount; revenue = stats.revenue };
      },
    );

    result.sort(func(a, b) { Int.compare(a.date, b.date) });
  };
};
