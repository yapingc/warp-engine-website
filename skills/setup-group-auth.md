---
name: setup-group-auth
description: 为已有丹青约项目接入项目组鉴权能力。当用户要求"接入项目组鉴权"、"按项目组控制权限"、"数据按组隔离"、"添加RLS"、"页面权限控制"时使用。
triggers:
  - 项目组鉴权
  - 项目组权限
  - 按组隔离
  - group auth
  - RLS
  - 行级安全
  - 页面权限
  - 权限控制
  - permissionGroup
  - roleCode
  - setup-group-auth
---

# 为已有项目接入项目组鉴权

本技能用于为基于旧模板创建的丹青约项目接入项目组级别的鉴权能力，包括：
- **表级鉴权**：通过 Supabase RLS（Row Level Security）实现数据按项目组隔离
- **页面级鉴权**：通过前端权限 hook/组件实现页面和按钮级别的访问控制

所有鉴权基于 **roleCode**（项目组代号，如 `fu362`），大小写不敏感。开发者无需知道数字 groupId。

## 前置条件检查

在开始之前，确认项目满足以下条件：

1. 项目已接入丹青约平台登录（有 `src/services/supabase.ts` 和 JWT 认证逻辑）
2. 项目已有 `VITE_APP_ID` 环境变量
3. 项目能正常通过 `/danqing-node/api/vibe-coding/permission/user/info` 获取 JWT

如果不满足，先通过 `danqing-develop-assistant` skill 完成基础初始化。

## 执行流程

### 步骤 1：检查项目现状

读取以下文件判断当前状态：

| 检查项 | 文件路径 | 判断标准 |
|---|---|---|
| Supabase 已接入 | `src/services/supabase.ts` | 存在且包含 `initSupabaseJwt` |
| UserInfo 类型 | `src/services/auth.ts` | 是否已有 `permissionGroupList` 且包含 `roleCode` |
| 权限 hook | `src/hooks/usePermission.ts` | 是否已存在 |
| 权限组件 | `src/components/PermissionGuard.tsx` | 是否已存在 |
| RLS 辅助函数 | 通过 MCP `db_execute_sql` 查询 | `get_user_role_codes` 函数是否已创建 |

### 步骤 2：更新 UserInfo 类型

如果 `src/services/auth.ts` 中的 `UserInfo` 类型不完整，更新为：

```typescript
export interface PermissionItem {
  permissionCode: string;
  permissionName: string;
  hasPermission: boolean;
  extValues?: Record<string, any>;
}

export interface PermissionGroup {
  groupId: number;
  groupName: string;
  roleCode: string;
}

export interface UserInfo {
  name: string;
  userEmail: string;
  avatar: string;
  userId: number;
  permissionList: PermissionItem[];
  identifyType: number;
  isLeihuo: boolean;
  isFuxiAdmin: boolean;
  permissionGroupList: PermissionGroup[];
}
```

### 步骤 3：创建前端权限工具

#### 3a. 创建 `src/hooks/usePermission.ts`

```typescript
import { useMemo } from 'react';

import { useAuth } from './useAuth';

import type { PermissionGroup, PermissionItem } from '@/services/auth';

interface UsePermissionReturn {
  hasRole: (roleCode: string) => boolean;
  hasAnyRole: (roleCodes: string[]) => boolean;
  getGroupByRole: (roleCode: string) => PermissionGroup | undefined;
  hasPermission: (code: string) => boolean;
  hasAllPermissions: (codes: string[]) => boolean;
  hasAnyPermission: (codes: string[]) => boolean;
  groups: PermissionGroup[];
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
```

#### 3b. 创建 `src/components/PermissionGuard.tsx`

```tsx
import type { ReactNode } from 'react';

import { usePermission } from '@/hooks/usePermission';

interface PermissionGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
  roleCode?: string;
  roleCodes?: string[];
  permissionCode?: string;
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
```

### 步骤 4：数据库 RLS 设置

与用户确认需要对哪些表启用项目组隔离，然后执行以下操作。

表中使用 `role_code TEXT` 列存储项目组代号（如 "fu362"），RLS 匹配大小写不敏感。

#### 4a. 获取 app_id 对应的 schema 名

```
schema = app_<VITE_APP_ID 中连字符替换为下划线>
```

#### 4b. 创建辅助函数（通过 MCP `db_apply_migration` 执行）

```sql
-- migration name: create_rls_helper_functions

-- 提取用户所有 roleCode（小写数组），用于 role_code 列的 RLS
CREATE OR REPLACE FUNCTION <schema>.get_user_role_codes()
RETURNS TEXT[] LANGUAGE sql STABLE AS $$
  SELECT COALESCE(
    (SELECT array_agg(lower(val))
     FROM jsonb_each_text(
       auth.jwt() -> 'app_metadata' -> 'group_roles'
     ) AS r(gid, val)),
    ARRAY[]::text[]
  );
$$;
```

#### 4c. 为已有表添加 role_code 列（如果还没有）

```sql
-- migration name: add_role_code_to_<table_name>

ALTER TABLE <schema>.<table_name>
  ADD COLUMN IF NOT EXISTS role_code TEXT;

-- 如需迁移已有数据到某个组：
-- UPDATE <schema>.<table_name> SET role_code = 'fu362' WHERE role_code IS NULL;
-- ALTER TABLE <schema>.<table_name> ALTER COLUMN role_code SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_<table_name>_role_code
  ON <schema>.<table_name>(role_code);
```

#### 4d. 启用 RLS 并创建 Policy

```sql
-- migration name: enable_rls_<table_name>

ALTER TABLE <schema>.<table_name> ENABLE ROW LEVEL SECURITY;

-- 大小写不敏感匹配
CREATE POLICY "role_select_policy" ON <schema>.<table_name>
  FOR SELECT TO authenticated
  USING (lower(role_code) = ANY(<schema>.get_user_role_codes()));

CREATE POLICY "role_insert_policy" ON <schema>.<table_name>
  FOR INSERT TO authenticated
  WITH CHECK (lower(role_code) = ANY(<schema>.get_user_role_codes()));

CREATE POLICY "role_update_policy" ON <schema>.<table_name>
  FOR UPDATE TO authenticated
  USING (lower(role_code) = ANY(<schema>.get_user_role_codes()))
  WITH CHECK (lower(role_code) = ANY(<schema>.get_user_role_codes()));

CREATE POLICY "role_delete_policy" ON <schema>.<table_name>
  FOR DELETE TO authenticated
  USING (lower(role_code) = ANY(<schema>.get_user_role_codes()));

-- 可选：撤销 anon 角色的权限（推荐）
REVOKE ALL ON <schema>.<table_name> FROM anon;
```

#### 4e. 验证 RLS 生效

通过 MCP `db_execute_sql` 执行查询，确认 RLS policy 已创建：

```sql
SELECT tablename, policyname, cmd, qual
FROM pg_policies
WHERE schemaname = '<schema>';
```

### 步骤 5：前端适配

#### 5a. 写入数据时携带 role_code

告知用户（或帮助修改代码），在前端插入/更新数据时必须携带 `role_code`：

```typescript
import { usePermission } from '@/hooks/usePermission';

function CreateForm() {
  const { groups } = usePermission();
  // 用户选择所属组，或使用默认组的 roleCode
  const currentRoleCode = groups[0]?.roleCode;

  const handleSubmit = async (data) => {
    await supabase.from('my_table').insert({
      ...data,
      role_code: currentRoleCode,
    });
  };
}
```

#### 5b. 页面级权限控制

根据用户需求，在路由或页面组件中添加权限守卫。使用 roleCode（大小写不敏感）：

```tsx
import { PermissionGuard } from '@/components/PermissionGuard';

// 路由级 — 按 roleCode 控制
<Route path="/admin" element={
  <PermissionGuard roleCode="fu362" fallback={<Navigate to="/" />}>
    <AdminPage />
  </PermissionGuard>
} />

// 组件级 — 属于任一项目组即可
<PermissionGuard roleCodes={['fu362']}>
  <button>仅指定项目组可见</button>
</PermissionGuard>

// 按权限码控制
<PermissionGuard permissionCode="interface.admin.manager.permission">
  <button>管理按钮</button>
</PermissionGuard>
```

### 步骤 6：验证清单

完成所有步骤后，按以下清单逐项验证：

- [ ] `usePermission` hook 能正确返回 `hasRole`/`hasAnyRole` 等方法
- [ ] `PermissionGuard` 组件支持 `roleCode`/`roleCodes` props
- [ ] 数据库 `get_user_role_codes()` 函数已创建
- [ ] 目标表已启用 RLS 且 Policy 已创建
- [ ] 有权用户能正常 CRUD 数据
- [ ] 无权用户查询返回空数组、写入被拒绝
- [ ] 前端插入数据时正确携带 `role_code`

## 安全说明

**为什么这套方案是安全的：**

1. JWT 由服务端签发（`/danqing-node/api/vibe-coding/permission/user/info`）
2. 服务端通过转发用户 cookie 到上游权限接口获取真实的 `permissionGroupList`
3. roleCode 映射写入 JWT 的 `app_metadata.group_roles`，用 `SUPABASE_JWT_SECRET` 签名
4. 数据库 RLS 通过 `auth.jwt()` 读取签名验证过的 claims，**前端无法篡改**
5. 前端的 `usePermission`/`PermissionGuard` 只是 UX 优化，不是安全边界

## 常见问题

### Q: roleCode 大小写不一致怎么办？
无需担心。`get_user_role_codes()` 返回的是全小写数组，RLS policy 对表中的 `role_code` 列也做了 `lower()` 处理，前端 `hasRole()` 同样大小写不敏感。

### Q: 已有数据没有 role_code 怎么办？
先用 UPDATE 批量设置默认值，再 ALTER COLUMN 设为 NOT NULL。如果暂时不能确定归属，可以保持 nullable 并在 Policy 中处理 NULL 的情况（如 `role_code IS NULL OR lower(role_code) = ANY(...)`）。

### Q: 一条数据需要对多个组可见怎么办？
将 `role_code TEXT` 改为 `role_codes TEXT[]`（数组），Policy 改为 `role_codes && get_user_role_codes()`（数组交集判断，需对数组元素做 lower 处理）。

### Q: 开发环境怎么测试不同组的视角？
修改 `.env` 中的测试账号，或让后端签发一个指定 group_roles 的测试 JWT。
