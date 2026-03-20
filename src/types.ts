export interface Vehicle {
  name: string;
  price: number;
  tax: number;
}

export interface Negotiation {
  id: string;
  date: string;
  vehicles: Vehicle[];
  totalTax: number;
  userProfit: number;
}
