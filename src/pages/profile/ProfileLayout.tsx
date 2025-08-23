import { motion } from "framer-motion";
import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { ProfileSidebar } from "@/components/profile/ProfileSidebar";
import { useIsMobile } from "@/hooks/use-mobile";

export default function ProfileLayout() {
  const isMobile = useIsMobile();

  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-background py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-6">
          <div className="md:sticky md:top-6 h-fit">
            <ProfileSidebar />
          </div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="min-h-[50vh]"
          >
            <Outlet />
          </motion.div>
        </div>
      </div>
    </div>
  );
} 