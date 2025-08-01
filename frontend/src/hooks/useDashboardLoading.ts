import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";

interface User {
  id: number;
  clerk_user_id: string;
  email: string;
  role: string;
  type: string;
  name: string;
}

interface ClassItem {
  instance_id: string;
  class_name: string;
  instructor_id: string;
  instructor_name?: string;
  start_time: string;
  duration: number;
  max_capacity: number;
  enrolled_count: number;
  description?: string;
  requirements?: string;
  recommended_attire?: string;
  is_enrolled?: boolean;
  enrollment_id?: number;
  payment_type?: string;
}

interface AnnouncementItem {
  id: number;
  title: string;
  content: string;
  created_at: string;
}

interface SlidingScaleOption {
  id: number;
  tier_name: string;
  price_min: number;
  price_max: number;
  description: string;
  category: string;
  stripe_price_id?: string;
}

interface DashboardLoadingState {
  isLoading: boolean;
  error: string | null;
  currentUser: User | null;
  enrolledClasses: ClassItem[];
  allClasses: ClassItem[];
  announcements: AnnouncementItem[];
  slidingScaleOptions: SlidingScaleOption[];
}

export function useDashboardLoading() {
  const { user, isLoaded } = useUser();
  const [state, setState] = useState<DashboardLoadingState>({
    isLoading: true,
    error: null,
    currentUser: null,
    enrolledClasses: [],
    allClasses: [],
    announcements: [],
    slidingScaleOptions: [],
  });

  useEffect(() => {
    const loadDashboardData = async () => {
      // If Clerk is still loading, keep loading state
      if (!isLoaded || !user) {
        setState((prev) => ({ ...prev, isLoading: true }));
        return;
      }

      try {
        setState((prev) => ({ ...prev, isLoading: true, error: null }));

        // Fetch all data in parallel
        const [
          userResponse,
          classesResponse,
          enrolledResponse,
          announcementsResponse,
          slidingScaleResponse,
        ] = await Promise.all([
          fetch(
            `http://localhost:5000/api/users/by-clerk-id?clerk_user_id=${user.id}`,
          ),
          fetch("http://localhost:5000/api/studio-classes/list"),
          fetch(
            `http://localhost:5000/api/students/enrolled-classes?clerk_user_id=${user.id}`,
          ),
          fetch("http://localhost:5000/api/announcements"),
          fetch("http://localhost:5000/api/sliding-scale-options"),
        ]);

        const [
          userData,
          classesData,
          enrolledData,
          announcementsData,
          slidingScaleData,
        ] = await Promise.all([
          userResponse.json(),
          classesResponse.json(),
          enrolledResponse.json(),
          announcementsResponse.json(),
          slidingScaleResponse.json(),
        ]);

        // Update state with all fetched data
        setState((prev) => ({
          ...prev,
          isLoading: false,
          currentUser: userData.success ? userData.user : null,
          allClasses: classesData.success ? classesData.classes || [] : [],
          enrolledClasses: enrolledData.success
            ? enrolledData.classes || []
            : [],
          announcements: announcementsData.success
            ? announcementsData.announcements || []
            : [],
          slidingScaleOptions: slidingScaleData.success
            ? slidingScaleData.options || []
            : [],
          error: null,
        }));
      } catch (err) {
        console.error("Dashboard loading error:", err);
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: "Failed to load dashboard data. Please try again.",
        }));
      }
    };

    loadDashboardData();
  }, [isLoaded, user]);

  return {
    ...state,
    user,
    isLoaded,
  };
}
