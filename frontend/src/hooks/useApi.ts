import { useState, useCallback } from "react";

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

// Type definitions for API data
interface UserData {
  id: number;
  clerk_user_id: string;
  email: string;
  name: string;
  role: string;
  type: string;
  created_at: string;
  updated_at: string;
}

interface ClassData {
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
}

interface PaymentData {
  id: number;
  amount: number;
  status: string;
  student_id: number;
  instance_id?: string;
  class_name?: string;
}

interface AnnouncementData {
  id: number;
  title: string;
  body: string;
  date_created: string;
}

export function useApi<T>() {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(
    async (url: string, options?: RequestInit): Promise<ApiResponse<T>> => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const response = await fetch(url, {
          headers: {
            "Content-Type": "application/json",
            ...options?.headers,
          },
          ...options,
        });

        const result = await response.json();

        if (response.ok && result.success) {
          setState({
            data: result.data || result,
            loading: false,
            error: null,
          });
          return { success: true, data: result.data || result };
        } else {
          const errorMessage = result.error || "An error occurred";
          setState({ data: null, loading: false, error: errorMessage });
          return { success: false, error: errorMessage };
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Network error";
        setState({ data: null, loading: false, error: errorMessage });
        return { success: false, error: errorMessage };
      }
    },
    [],
  );

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return {
    ...state,
    execute,
    reset,
  };
}

// Specific API hooks for different endpoints
export function useUserApi() {
  const api = useApi<UserData>();

  const createUser = useCallback(
    async (userData: Partial<UserData>) => {
      return api.execute("http://localhost:5000/api/users/create", {
        method: "POST",
        body: JSON.stringify(userData),
      });
    },
    [api],
  );

  const getUserByClerkId = useCallback(
    async (clerkUserId: string) => {
      return api.execute(
        `http://localhost:5000/api/users/by-clerk-id?clerk_user_id=${clerkUserId}`,
      );
    },
    [api],
  );

  const searchInstructors = useCallback(
    async (query: string) => {
      return api.execute(
        `http://localhost:5000/api/instructors/search?query=${encodeURIComponent(
          query,
        )}`,
      );
    },
    [api],
  );

  return {
    ...api,
    createUser,
    getUserByClerkId,
    searchInstructors,
  };
}

export function useClassApi() {
  const api = useApi<ClassData[]>();

  const getClasses = useCallback(async () => {
    return api.execute("http://localhost:5000/api/studio-classes/list");
  }, [api]);

  const getClassTemplates = useCallback(async () => {
    return api.execute("http://localhost:5000/api/studio-classes/templates");
  }, [api]);

  const bookClass = useCallback(
    async (bookingData: {
      student_id?: string;
      clerk_user_id?: string;
      instance_id: string;
    }) => {
      return api.execute("http://localhost:5000/api/studio-classes/book", {
        method: "POST",
        body: JSON.stringify(bookingData),
      });
    },
    [api],
  );

  const getEnrolledClasses = useCallback(
    async (studentId?: string, clerkUserId?: string) => {
      const params = new URLSearchParams();
      if (studentId) params.append("student_id", studentId);
      if (clerkUserId) params.append("clerk_user_id", clerkUserId);

      return api.execute(
        `http://localhost:5000/api/students/enrolled-classes?${params.toString()}`,
      );
    },
    [api],
  );

  const cancelEnrollment = useCallback(
    async (cancelData: {
      student_id?: string;
      clerk_user_id?: string;
      instance_id: string;
    }) => {
      return api.execute(
        "http://localhost:5000/api/students/cancel-enrollment",
        {
          method: "POST",
          body: JSON.stringify(cancelData),
        },
      );
    },
    [api],
  );

  return {
    ...api,
    getClasses,
    getClassTemplates,
    bookClass,
    getEnrolledClasses,
    cancelEnrollment,
  };
}

export function usePaymentApi() {
  const api = useApi<PaymentData>();

  const getSlidingScaleOptions = useCallback(async () => {
    return api.execute("http://localhost:5000/api/sliding-scale-options");
  }, [api]);

  const createCheckoutSession = useCallback(
    async (paymentData: {
      option_id: number;
      custom_amount?: number;
      student_id?: string;
      clerk_user_id?: string;
      instance_id?: string;
      class_name?: string;
    }) => {
      return api.execute("http://localhost:5000/create-checkout-session", {
        method: "POST",
        body: JSON.stringify(paymentData),
      });
    },
    [api],
  );

  const verifyPayment = useCallback(
    async (sessionId: string) => {
      return api.execute(
        `http://localhost:5000/verify-payment?session_id=${sessionId}`,
      );
    },
    [api],
  );

  return {
    ...api,
    getSlidingScaleOptions,
    createCheckoutSession,
    verifyPayment,
  };
}

export function useAnnouncementApi() {
  const api = useApi<AnnouncementData[]>();

  const getAnnouncements = useCallback(
    async (boardType: string = "student") => {
      return api.execute(
        `http://localhost:5000/api/announcements?board_type=${boardType}`,
      );
    },
    [api],
  );

  const createAnnouncement = useCallback(
    async (announcementData: {
      title: string;
      body: string;
      author_id: number;
      board_type?: string;
    }) => {
      return api.execute("http://localhost:5000/api/announcements", {
        method: "POST",
        body: JSON.stringify(announcementData),
      });
    },
    [api],
  );

  return {
    ...api,
    getAnnouncements,
    createAnnouncement,
  };
}
