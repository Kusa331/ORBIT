import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { User } from '../../../shared/schema';

interface UserEmailDisplayProps {
  userId: string;
}

export default function UserEmailDisplay({ userId }: UserEmailDisplayProps) {
  const { data: user, isLoading, isError } = useQuery<User>({
    queryKey: ['user', userId],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/admin/users/${userId}`);
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // Data considered fresh for 5 minutes
  });

  if (isLoading) {
    return <span>Loading email...</span>;
  }

  if (isError || !user) {
    return <span>Unknown User (ID: {userId})</span>;
  }

  return <span>{user.email && user.email.trim() !== '' ? user.email : `Email Not Available (ID: ${userId})`}</span>;
}
