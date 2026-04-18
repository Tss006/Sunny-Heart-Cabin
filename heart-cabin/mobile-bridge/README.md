# Android 手机桥接

这个目录是给 Android 手机上的小米运动健康 / Health Connect 桥接准备的独立应用骨架。

## 目标

- 读取 Android Health Connect 中同步过来的心率、步数和睡眠数据
- 将数据上传到当前项目的 `/report/add`
- 作为小米运动健康 APP 的中转层，而不是让网页直接读取手机里的私有数据

## 使用前提

- 手机是 Android
- 小米运动健康 APP 已开启向 Health Connect 的同步
- 手机与运行后端的电脑处于同一网络，或后端有可访问的公网地址

## 默认流程

1. 在小米运动健康里开启 Health Connect 同步
2. 打开这个 Android 桥接 App
3. 填写后端地址和用户 ID
4. 授权读取健康数据
5. 同步今天的数据到心晴小屋

## 后端接口

应用会向以下接口发送 JSON：

- `POST /report/add`

示例字段：

```json
{
  "userId": 12345,
  "heartRate": 75,
  "sleepHours": 7.5,
  "steps": 8200,
  "recordDate": "2026-04-18",
  "dataSource": "health_connect"
}
```

## 网络地址提示

- 模拟器里访问本机后端可以先用 `http://10.0.2.2:8080`
- 真机建议改成局域网里的电脑 IP，例如 `http://192.168.1.10:8080`

## 说明

这个仓库当前不是 Android 工程，所以这里只先补桥接 app 的独立骨架。你后续如果要，我可以继续把它补成可直接在 Android Studio 打开的完整工程。