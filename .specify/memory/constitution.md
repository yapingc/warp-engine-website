# Danqing AI Painting Platform Constitution

<!--
同步影响报告 (2025-12-29):
- 版本变更: 模板 → 1.0.0
- 新增原则: I. DDD 分层架构/COLA 架构、II. 依赖注入规范、III. API 路径规范、IV. 数据库访问规范、V. 代码质量规范、VI. 分支策略
- 新增章节: Java 服务开发规范、分支管理规范
- 需要更新的模板: plan-template.md (✅ 已检查，宪章检查部分为通用描述)
- 待处理: 无
- 更新记录 (2025-12-30):
  - 明确 I. DDD 分层架构即为 COLA 架构规范，添加 COLA 架构说明和依赖关系图
  - 说明前端规范位置：`.specify/memory/fe-rule.md`，本宪章主要覆盖 Java 后端规范
- 更新记录 (2025-01-XX):
  - 前端规范 (`fe-rule.md`) 已更新：补充了 003 功能中定义的详细 UnoCSS 规范，包括禁止硬编码值、优先使用 UnoCSS 类名、CSS Modules 使用 `cx` 函数、第三方组件样式定制等规则
-->

## 适用范围说明

**本宪章主要覆盖 Java 后端服务开发规范**（`packages/java-services/danqing-front-api`，通过 submodule 引入）。

**前端开发规范**请参考：`.specify/memory/fe-rule.md`
- 前端技术栈：React 18.2.0、TypeScript 5.4.5、Vite 5.4.11、Ant Design 5.x、Jotai
- 前端项目结构：monorepo（mainsite、manager、common 等）
- 前端编码规范：ESLint、Stylelint、Prettier、Commitlint

**项目历史**：
- 项目最初为前端项目，前端规范在 `fe-rule.md`
- 后续通过 submodule 引入 Java 后端项目（`packages/java-services/danqing-front-api`）
- 本宪章（`constitution.md`）主要规范 Java 后端开发，前端规范保持独立在 `fe-rule.md`

## Core Principles

### I. DDD 分层架构 / COLA 架构 (NON-NEGOTIABLE)

项目采用领域驱动设计（DDD）分层架构，严格遵循 **COLA（Clean Object-Oriented and Layered Architecture）** 架构规范。COLA 架构是一个整洁的、面向对象的、分层的、可扩展的应用架构，融合了 CQRS、DDD、SOLID 等设计思想。

**分层结构**（符合 COLA 架构规范）：
- **Client 层**：API 接口的请求/响应对象、服务接口定义（对外以 jar 包形式提供接口）
- **Adapter 层**：适配层，六边形架构中的入站适配器，接收 HTTP 请求，调用 App 层服务（Controller、Job、MQ Consumer）
- **App 层**：应用层，负责 CQRS 的指令处理工作，编排业务流程，调用 Gateway（Service、Executor）
- **Domain 层**：领域层，业务核心实现，提供防腐层接口（Gateway 接口定义），不依赖基础设施层的技术实现
- **Infrastructure 层**：基础设施层，六边形架构中的出站适配器，实现 Gateway 接口，处理数据库访问、外部服务调用，使用依赖倒置实现 Domain 暴露的防腐层接口

**调用链路**：`Controller → Service → Executor → Gateway → Infrastructure`

**依赖关系**（符合 COLA 架构规范）：
```
Adapter → App → Domain ← Infrastructure
   ↓       ↓       ↑
Client ←──┘       Infrastructure
```

**核心规则**：
- ✅ Controller 禁止编写业务逻辑，只负责接收请求和调用 Service
- ✅ Executor 禁止直接操作数据库，必须通过 Gateway 访问
- ✅ ServiceImpl 禁止直接依赖 Gateway，必须通过 Executor 调用
- ✅ Domain 层禁止依赖具体实现，只定义接口
- ✅ 对象转换：Cmd/Qry → Entity 使用 Assembler（App 层），Entity → DO 使用 Convertor（Infrastructure 层）

### II. 依赖注入规范 (NON-NEGOTIABLE)

**统一使用构造器注入**（Spring 官方推荐）。

**✅ 标准写法**：
```java
@Component
@RequiredArgsConstructor  // ✅ Lombok 自动生成构造器
public class XxxService {
    private final XxxGateway xxxGateway;  // ✅ final 保证不可变
}
```

**❌ 禁止写法**：
- 禁止使用 `@Resource` 或 `@Autowired` 字段注入
- 禁止手动编写构造器（除非有特殊需求）

**核心原则**：
- ✅ 所有类使用 `@RequiredArgsConstructor`
- ✅ 依赖字段声明为 `private final`
- ❌ 禁止使用 `@Resource` 或 `@Autowired` 字段注入

### III. API 路径规范 (NON-NEGOTIABLE)

**Controller 只写业务路径**，框架根据包路径自动拼接前缀。

**路径映射规则**：
- 运营端：包路径 `*.admin.**` → 最终路径 `/admin/api/v1/{domain}`
- 平台端 v1：包路径 `*.web.**` → 最终路径 `/api/v1/{domain}`
- 平台端 v2：包路径 `*.webv2.**` → 最终路径 `/api/v2/{domain}`

**✅ 正确写法**：
```java
@RestController
@RequestMapping("/credits")  // ✅ 只写业务路径
public class CreditsAdminController {
    // 包名：com.netease.fuxi.danqing.front.api.credits.admin
    // 最终路径：/admin/api/v1/credits
}
```

**❌ 禁止写法**：
- 禁止手动写完整路径前缀（如 `/admin/api/v1/credits`）
- 禁止在 `@RequestMapping` 中包含框架自动添加的前缀

**核心原则**：
- ✅ Controller 只写业务路径（如 `/credits`）
- ✅ 框架根据包路径自动匹配 Apollo 配置，拼接对应的 prefix
- ❌ 禁止手动写完整路径前缀

### IV. 数据库访问规范 (NON-NEGOTIABLE)

**统一使用 MyBatis-Flex**，禁止使用 MyBatis-Plus。

**查询规范**：
- ✅ 必须使用 Lambda 方法引用（类型安全）
- ❌ 禁止使用 TableDef 常量
- ✅ 复杂查询逻辑写在 Infrastructure 层
- ✅ 分页查询使用 `paginate` 方法，一次查询获取数据和总数

**✅ 正确写法**：
```java
mapper.selectOneByQuery(
    QueryWrapper.create()
        .from(CreditsAccount.class)
        .where(CreditsAccount::getUserId).eq(userId)
        .and(CreditsAccount::getStatus).eq(1)
);
```

**❌ 禁止写法**：
```java
// ❌ 禁止导入 TableDef
import static xxx.CreditsAccountTableDef.CREDITS_ACCOUNT;
// ❌ 禁止使用常量方式
QueryWrapper.create().from(CREDITS_ACCOUNT).where(CREDITS_ACCOUNT.USER_ID.eq(userId));
```

**SQL 编写规范**：
- ✅ SQL 保持简单，只负责 CRUD 操作
- ✅ 复杂的业务逻辑放在 Domain 实体或 Service 中
- ❌ 禁止在 SQL 中使用 `CASE WHEN`、`IF` 等复杂表达式
- ❌ 禁止使用 `setRaw()` 拼接复杂 SQL

**事务使用规范**：
- ✅ 多表操作需要事务时，使用 `@Transactional(rollbackFor = Exception.class)`
- ✅ 单条 SQL 操作不需要事务注解（数据库自动保证原子性）
- ✅ 使用乐观锁的单条更新不需要事务注解

### V. 代码质量规范

**命名规范**：
- 类名：UpperCamelCase（如 `CreditsAccount`）
- 方法名/变量名：lowerCamelCase（如 `getUserById`）
- 常量名：全大写+下划线（如 `MAX_RETRY_COUNT`）
- POJO 类后缀：Cmd/Qry（请求）、VO/DTO（响应）、Entity（领域实体）

**代码格式规范**：
- ✅ 单行字符数不超过 120 个
- ✅ 方法体行数不超过 80 行
- ✅ 单个方法参数不超过 7 个（推荐不超过 5 个）
- ✅ 大括号使用 K&R 风格（左括号不换行）
- ✅ 禁止行尾注释，注释在代码行上方

**代码复杂度限制**：
- ✅ 单个方法认知复杂度不超过 15
- ✅ 使用卫语句（Guard Clauses）减少嵌套
- ✅ 将复杂逻辑拆分为多个私有方法

**工具类使用原则**：
优先级顺序：`danqing-framework` → `Hutool` → 新建工具类
- ✅ 优先使用项目自有封装（如 `JsonUtils`、`RedisComponent`）
- ✅ 其次使用 Hutool（如 `CollUtil`、`CharSequenceUtil`）
- ✅ 确实没有时才新建，放入 `danqing-framework`

**魔法值禁用规范**：
- ✅ 字符串常量使用 `StringLabel` 接口
- ✅ 错误码使用 `ErrorCode` 枚举
- ❌ 禁止硬编码字符串、数字、错误消息

### VI. 分支管理规范

**Java 服务（java-server）分支策略**：
- 主分支：`release`
- 功能分支：基于 `release` 分支拉取
- 命名规则：涉及 java-server 开发时，功能分支名称应与当前功能分支保持一致（如 `006-gemini-text-generation-research`）

**核心原则**：
- ✅ 所有 java-server 相关开发必须基于 `release` 分支创建功能分支
- ✅ 功能分支命名与当前功能分支保持一致，便于关联和追踪
- ✅ 合并前必须通过代码审查和测试验证

## Java 服务开发规范

### 技术栈要求

- **框架**：Spring Boot 2.7.17
- **Java 版本**：Java 11
- **构建工具**：Maven
- **ORM**：MyBatis-Flex（⚠️ 禁用 MyBatis-Plus）
- **安全框架**：SaToken
- **任务调度**：XXL-JOB
- **缓存**：Redis（统一使用 `RedisComponent`）
- **消息队列**：RabbitMQ
- **监控**：SkyWalking

### Controller 层规范

**✅ 标准写法**：
```java
@RestController
@RequestMapping("/credits")
@Tag(name = "积分管理-运营端")
@ServiceMonitor  // ✅ 必须添加（自动记录RT和日志）
@RequiredArgsConstructor
@PreAuthenticated  // ✅ 类级别认证（推荐）
public class CreditsAdminController {
    private final CreditsService creditsService;
    
    @PostMapping("/grant")
    @Operation(summary = "发放积分")
    public SingleResponse<Boolean> grantCredits(@RequestBody @Valid AdminCreditsGrantCmd cmd) {
        return creditsService.grantCredits(cmd);
    }
}
```

**核心要点**：
- ✅ 统一使用 `@RestController`
- ✅ 必须添加 `@ServiceMonitor` 监控注解
- ✅ 参数校验使用 `@Valid` 或 `@Validated`
- ✅ 添加 Swagger 文档注解（`@Tag`, `@Operation`）
- ✅ 推荐在类级别添加 `@PreAuthenticated`
- ❌ 禁止在 Controller 中编写业务逻辑
- ❌ 有 `@ServiceMonitor` 后，禁止手动打 `log.info`

### Service 层规范

**Client 层接口定义**：
- 包路径：`*.client.{domain}.api`
- 接口命名：`XxxService`（平台端）、`XxxAdminService`（运营端）、`XxxV2Service`（平台端 v2）

**App 层实现**：
- 包路径：`*.app.{domain}.service`
- 实现类命名：`XxxServiceImpl`
- ✅ ServiceImpl 职责单一：调用对应的 Executor，不编写业务逻辑
- ❌ 禁止 ServiceImpl 直接依赖 Gateway，必须通过 Executor 调用

### Executor 层规范

**职责**：执行具体业务逻辑，调用 Gateway 访问数据。

**✅ 标准写法**：
```java
@Component
@Slf4j
@RequiredArgsConstructor
public class CreditsGrantCmdExe {
    private final CreditsAccountGateway creditsAccountGateway;
    private final CreditsAssembler creditsAssembler;
    
    public SingleResponse<Boolean> execute(CreditsGrantCmd cmd) {
        // 1. Cmd → Entity（使用 Assembler）
        CreditsAccount entity = assembler.toEntity(cmd);
        
        // 2. 调用 Gateway 操作数据
        creditsAccountGateway.save(entity);
        
        // 3. 返回结果
        return SingleResponse.of(true);
    }
}
```

**核心要点**：
- ✅ Executor 中只负责调用 Assembler 和 Gateway
- ✅ 对象转换逻辑放在 Assembler 中
- ❌ 禁止在 Executor 中编写对象构建代码（多个 `setXxx()`）
- ❌ 禁止 Executor 直接操作数据库，必须通过 Gateway

### Gateway 层规范

**职责**：实现 Domain 层定义的 Gateway 接口，处理数据访问。

**✅ 标准写法**：
```java
@Component
@RequiredArgsConstructor
public class CreditsAccountGatewayImpl implements CreditsAccountGateway {
    private final CreditsAccountMapper mapper;
    private final CreditsConvertor convertor;
    
    @Override
    public CreditsAccount getByUserId(Long userId) {
        CreditsAccountDO do = mapper.selectOneByQuery(
            QueryWrapper.create()
                .where(CreditsAccountDO::getUserId).eq(userId)
        );
        return convertor.toEntity(do);
    }
}
```

**核心要点**：
- ✅ Gateway 实现类在 Infrastructure 层
- ✅ 使用 Convertor 完成 Entity ↔ DO 转换
- ✅ 查询逻辑使用 MyBatis-Flex Lambda 表达式

### 异常处理规范

**异常类型选择**：
- `WarningException`：预期内的用户提示，温和提醒（如余额不足、参数校验失败）
- `BusinessException`：非预期的业务错误，需要关注（如系统错误、第三方服务失败）

**✅ 正确用法**：
```java
// ✅ 预期内的用户提示 → WarningException
if (insufficientBalance) {
    throw new WarningException("账户积分余额不足，请先充值");
}

// ✅ 非预期的业务错误 → BusinessException
if (dataInconsistent) {
    throw new BusinessException("数据状态异常，请联系管理员");
}
```

**核心原则**：
- ✅ 异常信息使用 `ErrorCode` 枚举统一定义
- ✅ 直接抛出异常，由 `GlobalExceptionHandler` 统一处理
- ✅ Controller/Executor 无需手动 try-catch
- ❌ 禁止硬编码错误消息字符串

### 参数校验规范

**参数校验职责分层**：参数校验应在 Controller 层通过 `@Valid` + JSR-303 注解完成。

**✅ 正确做法**：
```java
// Client 层 Cmd 对象
@Data
public class CreditsGrantCmd {
    @NotNull(message = "用户ID不能为空")
    @Schema(description = "用户ID")
    private Long userId;
}

// Controller 层
@PostMapping("/grant")
public SingleResponse<Boolean> grantCredits(@RequestBody @Valid CreditsGrantCmd cmd) {
    // ✅ 框架自动校验，校验失败会抛出异常
    return creditsService.grantCredits(cmd);
}
```

**核心原则**：
- ✅ 格式/非空校验：在 Cmd/Qry 对象中使用 JSR-303 注解
- ✅ 业务规则校验：在 Executor 中通过查询数据后判断
- ❌ 禁止在 Executor 中重复校验 JSR-303 注解已覆盖的内容

### 定时任务规范（XXL-JOB）

**✅ 标准写法**：
```java
@Slf4j
@Component
@RequiredArgsConstructor
public class CreditsGrantJob {
    private final CreditsAccountService creditsAccountService;
    
    @XxlJob("creditsDailyGrant")  // ✅ Job 名称使用 lowerCamelCase
    @Trace  // ✅ 添加链路追踪（可选但推荐）
    public void executeDailyGrant() {
        String param = XxlJobHelper.getJobParam();
        log.info("CreditsGrantJob.executeDailyGrant.start, params={}", param);
        // 业务逻辑
    }
}
```

**核心要点**：
- ✅ 类放置在 `adapter` 层的 `job` 包下
- ✅ 类命名使用 `XxxSchedule` 或 `XxxJob` 后缀
- ✅ 使用 `@XxlJob("jobName")` 注解，Job 名称使用 lowerCamelCase
- ✅ 使用 `@RequiredArgsConstructor` 构造器注入依赖
- ❌ 禁止在 Job 方法中直接操作数据库，应通过 Gateway 或 Service

## Governance

**宪章优先级**：本宪章优先于所有其他开发实践和规范文档。所有代码审查和开发活动必须验证是否符合本宪章。

**修订流程**：
1. 提出修订建议（需说明理由和影响范围）
2. 团队评审和讨论
3. 更新版本号和修订日期
4. 同步更新相关模板和文档
5. 通知所有团队成员

**合规审查**：
- 所有 PR/代码审查必须验证是否符合本宪章
- 新增功能开发前，应检查是否违反核心原则
- 违反核心原则的代码不得合并

**参考文档**：
- **Java 服务开发规范**：`packages/java-services/danqing-front-api/.codemaker.codebase.md`
- **前端开发规范**：`.specify/memory/fe-rule.md`（前端工程规则，包含 React、TypeScript、Jotai 等规范）
- 本宪章为 Java 后端开发的基础原则，前端开发请参考 `fe-rule.md`

**Version**: 1.0.2 | **Ratified**: 2025-12-29 | **Last Amended**: 2025-12-30
