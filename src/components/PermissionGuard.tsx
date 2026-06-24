import type { ReactNode } from 'react';

import { usePermission } from '@/hooks/usePermission';

interface PermissionGuardProps {
  children: ReactNode;
  /** 无权限时渲染的内容，默认不渲染任何东西 */
  fallback?: ReactNode;
  /** 要求用户属于指定项目组（按 roleCode，大小写不敏感） */
  roleCode?: string;
  /** 要求用户属于任一指定项目组（按 roleCode，大小写不敏感） */
  roleCodes?: string[];
  /** 要求用户拥有指定权限码 */
  permissionCode?: string;
  /** 要求用户拥有任一指定权限码 */
  permissionCodes?: string[];
}

export function PermissionGuard({
  children,
  fallback = null,
  roleCode,
  roleCodes,
  permissionCode,
  permissionCodes,
}: PermissionGuardProps) {
  const { hasRole, hasAnyRole, hasPermission, hasAnyPermission } = usePermission();

  let allowed = true;

  if (roleCode !== undefined) {
    allowed = allowed && hasRole(roleCode);
  }

  if (roleCodes !== undefined && roleCodes.length > 0) {
    allowed = allowed && hasAnyRole(roleCodes);
  }

  if (permissionCode !== undefined) {
    allowed = allowed && hasPermission(permissionCode);
  }

  if (permissionCodes !== undefined && permissionCodes.length > 0) {
    allowed = allowed && hasAnyPermission(permissionCodes);
  }

  return allowed ? <>{children}</> : <>{fallback}</>;
}
