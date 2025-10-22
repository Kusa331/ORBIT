import { supabase } from "@/lib/supabase";
import { LogOut, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

type SidebarItem = {
  id: string;
  label?: string;
  icon?: React.ElementType;
  // optional type to support dividers or groups
  type?: 'item' | 'divider';
  isLoading?: boolean;
};

type SidebarProps = {
  items: SidebarItem[];
  activeItem: string;
  onItemClick: (id: string) => void;
};

export default function Sidebar({ items, activeItem, onItemClick }: SidebarProps) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Logout Error",
        description: "There was an error logging out. Please try again.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      });
      setLocation("/login");
    }
  };

  return (
    <div className="material-card p-3 sm:p-4 flex flex-col h-full">
      {/* Logo / Title */}
      <div className="mb-3 sm:mb-4 flex items-center gap-3">
        {/* logo removed as requested - sidebar shows no header text or image */}
      </div>
      <nav className="flex-grow overflow-y-auto">
        <ul>
          {items.map((item) => {
            if (item.type === 'divider') {
              return (
                <li key={item.id} className="my-2 sm:my-3" aria-hidden>
                  <div className="h-px bg-gray-100 mx-2 sm:mx-4" />
                </li>
              );
            }

            return (
              <li key={item.id}>
                <button
                  onClick={() => onItemClick(item.id)}
                  disabled={item.isLoading}
                  className={`w-full text-left flex items-center px-3 sm:px-4 py-2 sm:py-3 rounded-lg transition-colors mb-1 text-sm sm:text-base ${
                    activeItem === item.id
                      ? "bg-pink-50 text-pink-700 font-semibold"
                      : "hover:bg-pink-50"
                  } ${item.isLoading ? "opacity-60 cursor-not-allowed" : ""}`}
                >
                  {item.isLoading ? (
                    <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-3 animate-spin" />
                  ) : (
                    item.icon && <item.icon className="h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-3 flex-shrink-0" />
                  )}
                  <span className="truncate">{item.isLoading ? "Loading..." : item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t flex-shrink-0">
        <button
          onClick={handleLogout}
          className="w-full text-left flex items-center px-3 sm:px-4 py-2 sm:py-3 rounded-lg hover:bg-pink-50 text-muted-foreground text-sm sm:text-base"
        >
          <LogOut className="h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-3 flex-shrink-0" />
          <span className="truncate">Log Out</span>
        </button>
      </div>
    </div>
  );
}