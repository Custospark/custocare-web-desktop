import { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { AlertTriangle, CircleAlert, RefreshCw } from 'lucide-react';

import {
  usePlatformUsers,
  useUpdateUserStatus,
} from '../statistics/api/platform-control/PlatformControlQueries';

import type {
  User,
  UserFilters,
  UsersResponse,
} from '../statistics/api/platform-control/PlatformControlTypes';

import UserPermissionsHeader from './user-permissions/UserPermissionsHeader';
import UserPermissionsMetricsGrid, {
  type UserPermissionsMetricItem,
} from './user-permissions/UserPermissionsMetricsGrid';
import UserPermissionsFiltersPanel from './user-permissions/UserPermissionsFiltersPanel';
import UserPermissionsTable from './user-permissions/UserPermissionsTable';
import UserPermissionsDrawer from './user-permissions/UserPermissionsDrawer';
import UserPermissionsStatusModal from './user-permissions/UserPermissionsStatusModal';
import {
  EmptyState,
  UserPermissionsTableSkeleton,
} from './user-permissions/userPermissions.primitives';
import {
  cn,
  formatNumber,
  getPageShellClass,
  getPanelClass,
} from './user-permissions/userPermissions.utils';

interface ThemeRootState {
  ui?: {
    theme?: 'light' | 'dark';
  };
}

const CLIENT_PAGE_SIZE = 10;

const DEFAULT_USER_FILTERS: UserFilters = {
  per_page: 100,
  page: 1,
  period: 'this_month',
};

function UserPermissions() {
  const theme = useSelector((state: ThemeRootState) => state.ui?.theme ?? 'light');
  const isDark = theme === 'dark';

  const [userFilters, setUserFilters] = useState<UserFilters>(DEFAULT_USER_FILTERS);
  const [userPage, setUserPage] = useState(1);

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [statusTarget, setStatusTarget] = useState<User | null>(null);

  const {
    data: usersResponse,
    isLoading: isUsersLoading,
    isFetching: isUsersFetching,
    error: usersError,
    refetch: refetchUsers,
  } = usePlatformUsers(userFilters);

  // ✅ Define the mutation hook
  const updateUserStatusMutation = useUpdateUserStatus();

  // ✅ FIX: Extract users array from response.data (which is the array directly)
  const users = useMemo(() => {
    if (!usersResponse?.data) return [];
    // If data is an array, use it directly
    if (Array.isArray(usersResponse.data)) {
      return usersResponse.data;
    }
    // If data has a nested data property (legacy format), use that
    if (usersResponse.data && 'data' in usersResponse.data && Array.isArray(usersResponse.data.data)) {
      return usersResponse.data.data;
    }
    return [];
  }, [usersResponse?.data]);

  const usersMeta = useMemo(() => {
    // Check if meta exists at the response level
    if (usersResponse?.meta) {
      return usersResponse.meta as UsersResponse['meta'];
    }
    // Check if meta is nested in data
    if (usersResponse?.data && 'meta' in usersResponse.data) {
      return usersResponse.data.meta as UsersResponse['meta'];
    }
    return undefined;
  }, [usersResponse]);

  // ✅ FIX: Get user counts from meta or calculate from users array
  const userCounts = useMemo(() => {
    if (usersMeta?.user_counts) {
      return usersMeta.user_counts;
    }
    
    // Calculate from users array if meta not available
    const total = users.length;
    const active = users.filter(u => u.status === 'active').length;
    const suspended = users.filter(u => u.status === 'suspended').length;
    const banned = users.filter(u => u.status === 'banned').length;
    
    return {
      total,
      today: 0,
      this_week: 0,
      this_month: total,
      active,
      suspended,
      banned,
    };
  }, [users, usersMeta]);

  const verifiedUsersCount = useMemo(
    () => users.filter((user) => Boolean(user.email_verified_at)).length,
    [users]
  );

  const unverifiedUsersCount = Math.max(0, users.length - verifiedUsersCount);

  const recentLoginCount = useMemo(
    () => users.filter((user) => Boolean(user.last_login_at)).length,
    [users]
  );

  const inactiveLoginCount = Math.max(0, users.length - recentLoginCount);

  const metrics = useMemo<UserPermissionsMetricItem[]>(
    () => [
      {
        title: 'Total Users',
        value: formatNumber(userCounts.total),
        subtitle: `${formatNumber(userCounts.this_month)} joined this month`,
        icon: CircleAlert,
        accent: 'blue',
      },
      {
        title: 'Active Users',
        value: formatNumber(userCounts.active),
        subtitle: `${formatNumber(userCounts.suspended)} suspended accounts`,
        icon: RefreshCw,
        accent: 'green',
      },
      {
        title: 'Banned Users',
        value: formatNumber(userCounts.banned),
        subtitle: 'Hard-restricted user accounts',
        icon: AlertTriangle,
        accent: 'rose',
      },
      {
        title: 'Verified Emails',
        value: formatNumber(verifiedUsersCount),
        subtitle: `${formatNumber(unverifiedUsersCount)} pending verification`,
        icon: CircleAlert,
        accent: 'violet',
      },
      {
        title: 'Recent Sign-ins',
        value: formatNumber(recentLoginCount),
        subtitle: `${formatNumber(inactiveLoginCount)} without login activity`,
        icon: RefreshCw,
        accent: 'amber',
      },
    ],
    [
      inactiveLoginCount,
      recentLoginCount,
      unverifiedUsersCount,
      userCounts.active,
      userCounts.banned,
      userCounts.suspended,
      userCounts.this_month,
      userCounts.total,
      verifiedUsersCount,
    ]
  );

  const totalUserPages = Math.max(1, Math.ceil(users.length / CLIENT_PAGE_SIZE));

  const paginatedUsers = useMemo(() => {
    const start = (userPage - 1) * CLIENT_PAGE_SIZE;
    return users.slice(start, start + CLIENT_PAGE_SIZE);
  }, [users, userPage]);

  const handleRefresh = async () => {
    await refetchUsers();
  };

  const handleUserFilterChange = (
    key: keyof UserFilters,
    value: string | number | undefined
  ) => {
    setUserPage(1);
    setUserFilters((prev) => {
      const nextValue = value === '' ? undefined : value;

      if (key === 'period') {
        return {
          ...prev,
          period: nextValue as UserFilters['period'],
          date_from: undefined,
          date_to: undefined,
        };
      }

      if (key === 'date_from' || key === 'date_to') {
        return {
          ...prev,
          [key]: nextValue,
          period: undefined,
        };
      }

      return {
        ...prev,
        [key]: nextValue,
      };
    });
  };

  const handleResetUserFilters = () => {
    setUserPage(1);
    setUserFilters(DEFAULT_USER_FILTERS);
  };

  const handleSubmitStatusUpdate = async (payload: {
    status: User['status'];
    reason?: string;
  }) => {
    if (!statusTarget) return;

    await updateUserStatusMutation.mutateAsync({
      userId: statusTarget.id,
      data: {
        status: payload.status,
        status_reason: payload.reason,
      },
    });

    setStatusTarget(null);
  };

  const activeError =
    usersError?.response?.data?.message || usersError?.message || undefined;

  const activeIsLoading = isUsersLoading && !usersResponse;

  return (
    <div className={getPageShellClass(isDark)}>
      <div className="mx-auto max-w-[1720px] space-y-6">
        <UserPermissionsHeader
          isDark={isDark}
          onRefresh={handleRefresh}
          isFetching={isUsersFetching}
          totalUsers={userCounts.total}
          activeUsers={userCounts.active}
          suspendedUsers={userCounts.suspended}
        />

        <UserPermissionsMetricsGrid isDark={isDark} metrics={metrics} />

        <UserPermissionsFiltersPanel
          isDark={isDark}
          userFilters={userFilters}
          onUserFilterChange={handleUserFilterChange}
          onResetUserFilters={handleResetUserFilters}
        />

        {activeError && (
          <div className={cn(getPanelClass(isDark), 'border-rose-500/20 p-5')}>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    'flex h-11 w-11 items-center justify-center rounded-2xl',
                    isDark ? 'bg-rose-500/10 text-rose-300' : 'bg-rose-50 text-rose-700'
                  )}
                >
                  <AlertTriangle className="h-5 w-5" />
                </div>

                <div>
                  <p
                    className={cn(
                      'text-sm font-semibold',
                      isDark ? 'text-white' : 'text-slate-950'
                    )}
                  >
                    Unable to load platform users
                  </p>
                  <p
                    className={cn(
                      'mt-1 text-sm',
                      isDark ? 'text-slate-400' : 'text-slate-600'
                    )}
                  >
                    {activeError}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleRefresh}
                className={cn(
                  'inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition-all',
                  isDark
                    ? 'bg-white/5 text-slate-200 hover:bg-white/10'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                )}
              >
                <RefreshCw className={cn('h-4 w-4', isUsersFetching && 'animate-spin')} />
                Retry
              </button>
            </div>
          </div>
        )}

        {activeIsLoading ? (
          <UserPermissionsTableSkeleton isDark={isDark} />
        ) : users.length ? (
          <UserPermissionsTable
            isDark={isDark}
            users={paginatedUsers}
            meta={usersMeta}
            currentPage={userPage}
            totalPages={totalUserPages}
            pageSize={CLIENT_PAGE_SIZE}
            totalItems={users.length}
            isFetching={isUsersFetching}
            onPageChange={setUserPage}
            onViewDetails={setSelectedUser}
            onOpenStatus={(user) => {
              updateUserStatusMutation.reset();
              setStatusTarget(user);
            }}
          />
        ) : (
          <EmptyState
            isDark={isDark}
            title="No platform users found"
            subtitle="No user records match the current permission filters."
            icon={CircleAlert}
          />
        )}
      </div>

      <UserPermissionsDrawer
        isDark={isDark}
        user={selectedUser}
        open={Boolean(selectedUser)}
        onClose={() => setSelectedUser(null)}
        onOpenStatus={(user) => {
          updateUserStatusMutation.reset();
          setStatusTarget(user);
        }}
      />

      <UserPermissionsStatusModal
        isDark={isDark}
        open={Boolean(statusTarget)}
        user={statusTarget}
        isSubmitting={updateUserStatusMutation.isPending}
        errorMessage={
          updateUserStatusMutation.error?.response?.data?.message ||
          updateUserStatusMutation.error?.message
        }
        onClose={() => {
          updateUserStatusMutation.reset();
          setStatusTarget(null);
        }}
        onSubmit={handleSubmitStatusUpdate}
      />
    </div>
  );
}

export default UserPermissions;