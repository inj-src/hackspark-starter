export interface Product {
  id: string;
  title: string;
  description: string;
  pricePerDay: number;
  imageUrl: string;
  category: string;
  lenderId: string;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
}
