---
name: vnc-access
type: repo
agent: CodeActAgent
---

## 远程访问规则

当你在沙箱中启动任何 Web 服务（dev server、preview 等）后：
1. **不要**让用户访问 localhost 或 127.0.0.1 地址，远程用户无法访问这些地址
2. 告知用户通过 noVNC 查看页面，地址格式为：

`http://<HOST_IP>:8080/vnc/<CONVERSATION_ID>/vnc.html?autoconnect=1&resize=remote`
