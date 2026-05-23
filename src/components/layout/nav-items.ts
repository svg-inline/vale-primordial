import { BookOpen, Boxes, Gem, MoonStar } from "lucide-react";

export const navItems = [
  { href: "/dusk", label: "Drops Dusk", icon: MoonStar },
  { href: "/equipments", label: "Equipamentos", icon: Boxes },
  { href: "/divine-books", label: "Livros Divinos", icon: BookOpen },
  { href: "/stones", label: "Pedras", icon: Gem },
] as const;
