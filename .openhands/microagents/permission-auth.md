---
name: permission-auth
type: repo
agent: CodeActAgent
triggers:
  - "权限"
  - "鉴权"
  - "项目组"
  - "permission"
  - "RLS"
  - "row level security"
  - "group"
  - "roleCode"
---

# 项目组鉴权规则

## 核心安全原则（NON-NEGOTIABLE）

**当页面涉及数据库表的数据时，必须启用表级 RLS 鉴权。仅做前端路由/组件级权限控制是不安全的，绝对禁止。**

- ❌ 禁止只用 `PermissionGuard`/`usePermission` 做前端过滤而不设置 RLS
- ❌ 禁止认为"前端隐藏了按钮/页面"就等于安全
- ✅ 任何按项目组隔离的数据表，**必须**启用 RLS + Policy
- ✅ 前端权限控制只是 UX 优化（隐藏无权操作），**不是安全边界**

**实现鉴权时的正确顺序：**
1. 先做数据库 RLS（安全层）
2. 再做前端权限过滤（体验层）

不允许跳过第 1 步直接做第 2 步。

## 安全模型

本项目采用 **服务端签发 JWT + 数据库 RLS** 的安全模型：

```
用户登录 → RBAC Cookie → 服务端用 cookie 请求权限接口 → 服务端签发含 group_roles 的 JWT → 前端用 JWT 访问 Supabase
```

**关键安全点：**
- JWT 由服务端签发（`/danqing-node/api/vibe-coding/permission/user/info`），前端无法伪造
- 服务端通过转发用户 cookie 到上游权限接口获取真实身份，不信任任何前端传入的身份数据
- 数据库 RLS 通过 `auth.jwt()` 读取 JWT claims 进行行级过滤，安全不依赖前端
- 前端权限控制只是 UX 优化（隐藏无权操作），不是安全边界
- **即使前端没做任何权限判断，只要 RLS 启用，无权用户也无法访问数据——这才是真正的安全**

## JWT Claims 结构

服务端签发的 JWT 包含以下自定义 claims：

```json
{
  "sub": "username",
  "role": "authenticated",
  "iss": "supabase",
  "iat": 1700000000,
  "exp": 1700003600,
  "app_metadata": {
    "groups": [90036, 90057, 90213],
    "group_roles": {
      "90036": "l10",
      "90057": "l36",
      "90213": "fu362"
    }
  }
}
```

| 字段 | 说明 |
|---|---|
| `app_metadata.group_roles` | groupId → roleCode 的映射，**roleCode 是项目组代号**（如 `l36` = 逆水寒手游） |
| `app_metadata.groups` | 用户所属项目组的 groupId 数组（内部使用，开发者无需关心） |

**重要**：开发者通常只知道项目组代号（roleCode），不知道数字 groupId。所有鉴权逻辑统一基于 roleCode，大小写不敏感。

## 表级鉴权（RLS）

### 何时启用 RLS

当表的数据需要按项目组隔离时（如：只有特定项目组的人能查看/编辑该组的数据），必须启用 RLS。

### 实施步骤

#### 1. 表结构：添加 role_code 列

需要按项目组隔离的表必须包含 `role_code TEXT` 列：

```sql
CREATE TABLE <%= appSchema %>.my_table (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  role_code TEXT NOT NULL,
  -- 其他字段...
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_my_table_role_code ON <%= appSchema %>.my_table(role_code);
```

#### 2. 创建辅助函数

在 schema 中创建提取 JWT roleCodes 的辅助函数（只需执行一次）：

```sql
CREATE OR REPLACE FUNCTION <%= appSchema %>.get_user_role_codes()
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

#### 3. 启用 RLS 并创建 Policy

```sql
ALTER TABLE <%= appSchema %>.my_table ENABLE ROW LEVEL SECURITY;

-- 大小写不敏感匹配
CREATE POLICY "role_select" ON <%= appSchema %>.my_table
  FOR SELECT USING (
    lower(role_code) = ANY(<%= appSchema %>.get_user_role_codes())
  );

CREATE POLICY "role_insert" ON <%= appSchema %>.my_table
  FOR INSERT WITH CHECK (
    lower(role_code) = ANY(<%= appSchema %>.get_user_role_codes())
  );

CREATE POLICY "role_update" ON <%= appSchema %>.my_table
  FOR UPDATE USING (
    lower(role_code) = ANY(<%= appSchema %>.get_user_role_codes())
  )
  WITH CHECK (
    lower(role_code) = ANY(<%= appSchema %>.get_user_role_codes())
  );

CREATE POLICY "role_delete" ON <%= appSchema %>.my_table
  FOR DELETE USING (
    lower(role_code) = ANY(<%= appSchema %>.get_user_role_codes())
  );
```

#### 4. 完整 SQL 模板

直接使用 `sql/enable-group-rls.sql` 中的模板，替换表名即可。

### RLS 常见模式

| 场景 | Policy USING 条件 |
|---|---|
| 按项目组隔离 | `lower(role_code) = ANY(get_user_role_codes())` |
| 公开读 + 按组写 | SELECT: `true`，INSERT/UPDATE/DELETE: `lower(role_code) = ANY(get_user_role_codes())` |
| 创建者可改 + 同组可读 | SELECT: `lower(role_code) = ANY(get_user_role_codes())`，UPDATE/DELETE: `created_by = auth.jwt()->>'sub'` |
| 多组可见 | 列改为 `role_codes TEXT[]`，条件改为 `role_codes && get_user_role_codes()` |
| Worker 绕过 RLS | `coalesce(auth.jwt()->'app_metadata'->>'worker', '') = 'true'`（见 `rules/worker-service.md`） |

### 注意事项

- **roleCode 大小写不敏感**：接口返回的 roleCode 可能大小写不一致，`get_user_role_codes()` 统一转小写后比较
- **启用 RLS 后必须有 Policy**：没有 Policy 的表会拒绝所有请求（返回空数组）
- **anon 角色不受 authenticated 的 Policy 保护**：如果不需要匿名访问，不要给 anon 角色 GRANT 权限
- **INSERT 使用 WITH CHECK 而非 USING**：INSERT 没有现有行，只能用 WITH CHECK 约束新数据
- **性能**：在 `role_code` 列上建索引，避免全表扫描

## 页面级鉴权（前端）

### 使用 usePermission hook

```tsx
import { usePermission } from '@/hooks/usePermission';

function MyPage() {
  const { hasRole, hasAnyRole, hasPermission } = usePermission();

  // 按 roleCode 检查（大小写不敏感）
  if (!hasRole('l36')) {
    return <div>无权限访问</div>;
  }

  // 检查用户是否拥有特定权限
  if (!hasPermission('interface.admin.manager.permission')) {
    return <div>无管理权限</div>;
  }

  return <div>页面内容</div>;
}
```

### 使用 PermissionGuard 组件

```tsx
import { PermissionGuard } from '@/components/PermissionGuard';

function MyPage() {
  return (
    <div>
      {/* 按 roleCode 控制（大小写不敏感） */}
      <PermissionGuard roleCode="l36" fallback={<span>无权限</span>}>
        <AdminPanel />
      </PermissionGuard>

      {/* 属于任一项目组即可 */}
      <PermissionGuard roleCodes={['l36', 'fu362']}>
        <SharedContent />
      </PermissionGuard>

      {/* 按权限码控制 */}
      <PermissionGuard permissionCode="interface.admin.manager.permission">
        <button>管理按钮</button>
      </PermissionGuard>
    </div>
  );
}
```

### 路由级鉴权

```tsx
import { PermissionGuard } from '@/components/PermissionGuard';

const routes = [
  {
    path: '/admin',
    element: (
      <PermissionGuard roleCode="l36" fallback={<Navigate to="/" />}>
        <AdminPage />
      </PermissionGuard>
    ),
  },
];
```

### 写入数据时携带 role_code

```tsx
import { usePermission } from '@/hooks/usePermission';

function CreateForm() {
  const { groups } = usePermission();
  const currentRoleCode = groups[0]?.roleCode;

  const handleSubmit = async (data) => {
    await supabase.from('my_table').insert({
      ...data,
      role_code: currentRoleCode,
    });
  };
}
```

## 前后端配合检查清单

实现项目组鉴权时，必须同时完成：

- [ ] 表结构包含 `role_code TEXT` 列
- [ ] 执行 `sql/enable-group-rls.sql` 创建辅助函数 + 启用 RLS + Policy
- [ ] 前端写入数据时携带正确的 `role_code`
- [ ] 前端使用 `usePermission` 或 `PermissionGuard` 隐藏无权操作（UX优化）
- [ ] 通过 REST API 验证 RLS 生效（不同组的用户只能看到各自数据）
