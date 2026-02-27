import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Time "mo:core/Time";

module {
  type BowlSize = { #small; #medium; #large };
  type SubscriptionPlan = { #weekly; #monthly };
  type SubscriptionStatus = { #active; #paused; #cancelled; #expired };
  type PaymentStatus = { #pending; #paid; #overdue };

  type OldSubscription = {
    id : Nat;
    customerName : Text;
    customerPhone : Text;
    plan : SubscriptionPlan;
    startDate : Time.Time;
    status : { #active; #paused; #cancelled };
    totalDeliveriesMade : Nat;
  };

  type OldActor = {
    subscriptions : Map.Map<Nat, OldSubscription>;
  };

  type NewSubscription = {
    id : Nat;
    customerName : Text;
    customerPhone : Text;
    plan : SubscriptionPlan;
    startDate : Time.Time;
    endDate : Time.Time;
    bowlSize : BowlSize;
    price : Float;
    paymentStatus : PaymentStatus;
    status : SubscriptionStatus;
    totalDeliveriesMade : Nat;
  };

  type NewActor = {
    subscriptions : Map.Map<Nat, NewSubscription>;
  };

  public func run(old : OldActor) : NewActor {
    let newSubscriptions = old.subscriptions.map<Nat, OldSubscription, NewSubscription>(
      func(_id, sub) {
        let endDate = switch (sub.plan) {
          case (#weekly) {
            sub.startDate + (7 * 24 * 60 * 60 * 1_000_000_000);
          };
          case (#monthly) {
            sub.startDate + (30 * 24 * 60 * 60 * 1_000_000_000);
          };
        };
        {
          sub with
          endDate;
          bowlSize = #medium;
          price = 0.0;
          paymentStatus = #pending;
          status = switch (sub.status) {
            case (#active) { #active };
            case (#paused) { #paused };
            case (#cancelled) { #cancelled };
          };
        };
      }
    );
    { subscriptions = newSubscriptions };
  };
};
