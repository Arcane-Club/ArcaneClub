import { Badge } from "@/components/ui/badge";

interface UserBadgeProps {
  role: string; // Using string to be flexible, though typically "USER" | "ADMIN" | "MODERATOR"
}

export function UserBadge({ role }: UserBadgeProps) {
  if (role === "USER") {
    // Optional: Show nothing for normal users, or a "Member" badge
    // returning null for cleaner look as per most forums
    return <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 border-gray-300 text-gray-500 font-normal">会员</Badge>;
  }

  const getBadgeConfig = (r: string) => {
    switch (r) {
      case "ADMIN":
        return { label: "管理员", className: "bg-red-500 hover:bg-red-600 text-white border-transparent" };
      case "MODERATOR":
        return { label: "版主", className: "bg-green-500 hover:bg-green-600 text-white border-transparent" };
      default:
        return { label: r, className: "bg-gray-500 text-white border-transparent" };
    }
  };

  const config = getBadgeConfig(role);

  return (
    <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 h-5 ${config.className}`}>
      {config.label}
    </Badge>
  );
}
