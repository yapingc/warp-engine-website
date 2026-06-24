# 日期格式规则

## 规则说明

**所有规格文件中的日期必须使用系统实际日期，格式为 `YYYY-MM-DD`**

## 规则要求

1. **禁止行为**：
   - ❌ 不得使用猜测、假设或硬编码的日期
   - ❌ 不得使用未来日期
   - ❌ 不得使用错误的日期格式

2. **必须行为**：
   - ✅ 在创建或更新规格文件前，**必须**使用系统命令获取当前日期
   - ✅ 日期格式必须为 `YYYY-MM-DD`（例如：`2025-12-29`）
   - ✅ 所有日期占位符 `[DATE]` 必须替换为实际日期

## 获取日期的方法

### Bash (Linux/macOS)
```bash
date +%Y-%m-%d
# 输出示例：2025-12-29
```

### PowerShell (Windows)
```powershell
Get-Date -Format "yyyy-MM-dd"
# 输出示例：2025-12-29
```

### Node.js/JavaScript
```javascript
new Date().toISOString().split('T')[0]
// 输出示例：2025-12-29
```

## 应用位置

以下文件中的日期字段必须遵守此规则：

1. **规格文件** (`spec.md`)：
   - `**创建时间**：[DATE]` → 必须替换为实际日期

2. **检查清单** (`checklists/requirements.md`)：
   - `**Created（创建时间）**: [DATE]` → 必须替换为实际日期

3. **计划文件** (`plan.md`)：
   - `**日期**：[DATE]` → 必须替换为实际日期

4. **其他文档**：
   - 所有包含 `[DATE]` 占位符的模板文件

## 验证方法

创建或更新文件后，验证日期是否正确：

```bash
# 获取当前日期
CURRENT_DATE=$(date +%Y-%m-%d)

# 检查规格文件中的日期
grep "创建时间" specs/feature/*/spec.md | grep -v "$CURRENT_DATE"
# 如果输出为空，说明日期正确；如果有输出，说明存在错误的日期
```

## 自动化检查

建议在创建规格文件的脚本中添加日期验证：

```bash
# 在写入文件前获取日期
CURRENT_DATE=$(date +%Y-%m-%d)

# 写入文件时替换占位符
sed "s/\[DATE\]/$CURRENT_DATE/g" template.md > output.md

# 写入后验证
if ! grep -q "$CURRENT_DATE" output.md; then
    echo "ERROR: Date not properly set in output file"
    exit 1
fi
```

## 历史问题

- **005-smart-prompt-generator**：初始创建时使用了错误的日期 `2025-01-27`，已修复为 `2025-12-29`

## 注意事项

- 日期必须反映文件**实际创建或更新**的日期
- 如果文件被修改但日期未更新，应该更新日期字段
- 多个文件（spec.md、checklists/requirements.md）中的日期应该保持一致
