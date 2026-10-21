import {
  Building2,
  CalendarCheck,
  CreditCard,
  LayoutDashboard,
  LayoutGrid,
  ShoppingCart,
  Truck,
  UserCog,
  UserPlus,
  Users,
  Users2,
  WalletCards,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { MODULES } from "@/lib/modules";

export interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
}

export interface SystemItem {
  fullName: string;
  desc: string;
  icon: LucideIcon;
  active: boolean;
  url?: string;
}

export type SystemChild = SystemItem;

const MODULE_ICONS: Record<(typeof MODULES)[number]["name"], LucideIcon> = {
  Dashboard: LayoutDashboard,
  Attendance: CalendarCheck,
  "Employee Information": Users,
  "Payroll & ESS": WalletCards,
  "Recruitment and Hiring": UserPlus,
  "User Management": UserCog,
};

/** The sidebar, top to bottom: one tab per Module, in Module order. */
export const sidebarItems: NavItem[] = MODULES.map((m) => ({
  name: m.name,
  href: m.href,
  icon: MODULE_ICONS[m.name],
}));

export const systems: SystemItem[] = [
  {
    fullName: "Enterprise Portal",
    desc: "All systems hub & app launcher",
    icon: LayoutGrid,
    active: false,
    url: process.env.NEXT_PUBLIC_HOST_URL ?? "https://localhost:3000/",
  },
  {
    fullName: "Customer Relationship Management",
    desc: "Contact profiles, tickets & marketing",
    icon: Building2,
    active: false,
    url: process.env.NEXT_PUBLIC_CRMS_URL ?? "https://localhost:3005/",
  },
  {
    fullName: "Human Resource Management",
    desc: "Staff directory & payroll",
    icon: Users2,
    active: true,
    url: process.env.NEXT_PUBLIC_HRMS_URL ?? "http://localhost:3001/",
  },
  {
    fullName: "E-Commerce Storefront",
    desc: "Online orders & products",
    icon: ShoppingCart,
    active: false,
    url: process.env.NEXT_PUBLIC_OOS_URL ?? "https://localhost:3004/",
  },
  {
    fullName: "Point of Sale",
    desc: "Retail & register checkout",
    icon: CreditCard,
    active: false,
    url: process.env.NEXT_PUBLIC_POS_URL ?? "https://localhost:3002/",
  },
  {
    fullName: "Supply Chain Management",
    desc: "Inventory & logistics",
    icon: Truck,
    active: false,
    url: process.env.NEXT_PUBLIC_SCMS_URL ?? "https://localhost:3003/",
  },
];
