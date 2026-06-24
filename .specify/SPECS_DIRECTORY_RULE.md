# 功能规格目录规范

## 目录结构

所有功能规格必须统一放在 `specs/feature/` 目录下。

**规范路径**：`specs/feature/[###-feature-name]/`

**示例**：
- `specs/feature/001-refactor-styles-pipeline-manage/`
- `specs/feature/002-pipeline-analytics/`
- `specs/feature/005-smart-prompt-generator/`

## 目录命名规则

1. **格式**：`[三位数字]-[功能短名]`
2. **编号**：从 001 开始，按顺序递增
3. **短名**：2-4 个词，使用连字符分隔，全小写
4. **示例**：
   - ✅ `001-user-auth`
   - ✅ `002-pipeline-analytics`
   - ✅ `005-smart-prompt-generator`
   - ❌ `001-UserAuth`（不应使用驼峰）
   - ❌ `1-user-auth`（编号必须是三位数）

## 脚本行为

所有相关脚本（`create-new-feature.sh`、`create-new-feature.ps1`、`common.sh`、`common.ps1`）已统一配置为使用 `specs/feature/` 目录。

**重要**：使用 `/speckit.specify` 命令创建新功能时，会自动在 `specs/feature/` 目录下创建对应的功能目录。

## 历史说明

- 之前脚本默认使用 `specs/` 目录
- 项目实际使用 `specs/feature/` 目录
- 已统一修复所有脚本，确保一致性

## 验证方法

创建新功能后，验证目录是否正确：

```bash
# 检查功能目录是否存在
ls -la specs/feature/[###-feature-name]/

# 检查规格文件是否存在
test -f specs/feature/[###-feature-name]/spec.md && echo "OK" || echo "ERROR"
```
