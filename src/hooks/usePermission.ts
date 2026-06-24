import { useMemo } from 'react';

import { useAuth } from './useAuth';

import type { PermissionGroup, PermissionItem } from '@/services/auth';

interface UsePermissionReturn {
  /** 用户是否属于指定项目组（按 roleCode，大小写不敏感） */
  hasRole: (roleCode: string) => boolean;
  /** 用户是否属于任一指定项目组（按 roleCode，大小写不敏感） */
  hasAnyRole: (roleCodes: string[]) => boolean;
  /** 根据 roleCode 获取项目组信息（大小写不敏感），不属于则返回 undefined */
  getGroupByRole: (roleCode: string) => PermissionGroup | undefined;
  /** 用户是否拥有指定权限（permissionCode 且 hasPermission 为 true） */
  hasPermission: (code: string) => boolean;
  /** 用户是否拥有全部指定权限 */
  hasAllPermissions: (codes: string[]) => boolean;
  /** 用户是否拥有任一指定权限 */
  hasAnyPermission: (codes: string[]) => boolean;
  /** 用户所属项目组列表 */
  groups: PermissionGroup[];
  /** 用户权限列表 */
  permissions: PermissionItem[];
}

export function usePermission(): UsePermissionReturn {
  const { userInfo } = useAuth();

  const roleMap = useMemo(() => {
    const map = new Map<string, PermissionGroup>();
    for (const g of userInfo?.permissionGroupList ?? []) {
      map.set(g.roleCode.toLowerCase(), g);
    }
    return map;
  }, [userInfo?.permissionGroupList]);

  const permissionSet = useMemo(() => {
    const set = new Set<string>();
    for (const p of userInfo?.permissionList ?? []) {
      if (p.hasPermission) {
        set.add(p.permissionCode);
      }
    }
    return set;
  }, [userInfo?.permissionList]);

  return useMemo(
    () => ({
      hasRole: (roleCode: string) => roleMap.has(roleCode.toLowerCase()),
      hasAnyRole: (roleCodes: string[]) => roleCodes.some((c) => roleMap.has(c.toLowerCase())),
      getGroupByRole: (roleCode: string) => roleMap.get(roleCode.toLowerCase()),
      hasPermission: (code: string) => permissionSet.has(code),
      hasAllPermissions: (codes: string[]) => codes.every((c) => permissionSet.has(c)),
      hasAnyPermission: (codes: string[]) => codes.some((c) => permissionSet.has(c)),
      groups: userInfo?.permissionGroupList ?? [],
      permissions: userInfo?.permissionList ?? [],
    }),
    [roleMap, permissionSet, userInfo?.permissionGroupList, userInfo?.permissionList],
  );
}
