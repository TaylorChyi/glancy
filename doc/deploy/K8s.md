# K8s 部署手册

> 适用集群：`glancy-staging`、`glancy-prod`。本文以 `cn-beijing` 的 ACK/K8s 集群为例，落地 ConfigMap/Secret、Deployment、Service、Ingress 以及零停机发布/回滚流程。

## 1. 集群约定
1. **命名空间**：`glancy-staging`、`glancy-prod`。所有工作负载（含 ConfigMap/Secret）必须位于对应命名空间，禁止跨命名空间引用。
2. **节点池**：
   - Backend：2 vCPU / 4 GiB 起，开启自动扩缩容。
   - Website：1 vCPU / 2 GiB 即可，可使用 Spot 节点。
3. **存储**：
   - 日志：推荐接入集中日志（如 Aliyun SLS）或挂载只写 `emptyDir` + Sidecar。
   - TTS/配置：如需外部 `tts-config.yml`，使用 `ConfigMap` 或 `Secret` + `Projected Volume`。
4. **入口**：
   - API：`Ingress` + WAF，域名 `api.<env>.glancy.xyz`。
   - Web：`Ingress` + CDN/Edge。静态站点也可直接由 OSS/CDN 提供，K8s 仅作为回源。

## 2. 基础资源
### 2.1 ConfigMap（示例）
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: glancy-backend-config
  namespace: glancy-staging
  labels:
    app: glancy-backend
    env: staging
data:
  SPRING_PROFILES_ACTIVE: "staging"
  SPRING_DATASOURCE_URL: "jdbc:mysql://mysql.staging:3306/glancy_db?useSSL=true&serverTimezone=Asia/Shanghai&characterEncoding=utf8"
  SPRING_DATASOURCE_USERNAME: "glancy_user"
  LOG_PATH: "/var/log/glancy"
  MANAGEMENT_ENDPOINT_HEALTH_PROBES_ENABLED: "true"
  VITE_SHARE_BASE_URL: "https://staging.glancy.xyz/share"
```

### 2.2 Secret（示例）
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: glancy-backend-secret
  namespace: glancy-staging
stringData:
  DB_PASSWORD: "********"
  GLANCY_SMTP_PASSWORD: "********"
  THIRDPARTY_DOUBAO_API_KEY: "volces-***"
  OSS_ACCESS_KEY_ID: "LTAI***"
  OSS_ACCESS_KEY_SECRET: "***"
  OSS_SECURITY_TOKEN: "***"
  VOLCENGINE_APP_ID: "***"
  VOLCENGINE_ACCESS_TOKEN: "***"
```
> 建议由管控仓（例如 GitOps + SOPS）管理 YAML，再由 ArgoCD/Flux 同步到集群，确保所有改动可审计。

## 3. Backend Deployment
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: glancy-backend
  namespace: glancy-staging
  labels:
    app: glancy-backend
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 0
      maxSurge: 1
  selector:
    matchLabels:
      app: glancy-backend
  template:
    metadata:
      labels:
        app: glancy-backend
    spec:
      containers:
        - name: backend
          image: registry.glancy.xyz/glancy/backend:v1.3.0
          imagePullPolicy: IfNotPresent
          ports:
            - containerPort: 8080
          envFrom:
            - configMapRef:
                name: glancy-backend-config
            - secretRef:
                name: glancy-backend-secret
          volumeMounts:
            - name: log-dir
              mountPath: /var/log/glancy
          readinessProbe:
            httpGet:
              path: /actuator/health/readiness
              port: 8080
            periodSeconds: 10
            failureThreshold: 3
          livenessProbe:
            httpGet:
              path: /actuator/health/liveness
              port: 8080
            initialDelaySeconds: 60
            periodSeconds: 30
          startupProbe:
            httpGet:
              path: /actuator/health
              port: 8080
            failureThreshold: 30
            periodSeconds: 5
          resources:
            requests:
              cpu: "500m"
              memory: "1Gi"
            limits:
              cpu: "1"
              memory: "2Gi"
      volumes:
        - name: log-dir
          emptyDir: {}
```
> 若尚未开启 Actuator 的 readiness/liveness 细分，可通过环境变量 `MANAGEMENT_ENDPOINT_HEALTH_PROBES_ENABLED=true`（见 ConfigMap）开启。

### 3.1 Service + Ingress
```yaml
apiVersion: v1
kind: Service
metadata:
  name: glancy-backend
  namespace: glancy-staging
spec:
  selector:
    app: glancy-backend
  ports:
    - port: 80
      targetPort: 8080
      name: http
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: glancy-backend
  namespace: glancy-staging
  annotations:
    nginx.ingress.kubernetes.io/proxy-body-size: "10m"
    cert-manager.io/cluster-issuer: letsencrypt
spec:
  tls:
    - hosts:
        - api.staging.glancy.xyz
      secretName: glancy-backend-tls
  rules:
    - host: api.staging.glancy.xyz
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: glancy-backend
                port:
                  number: 80
```

## 4. Website Deployment（可选）
若网站静态资源通过 OSS/CDN 提供，可跳过 K8s。若需在集群内托管，则可使用：
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: glancy-website
  namespace: glancy-staging
spec:
  replicas: 2
  selector:
    matchLabels:
      app: glancy-website
  template:
    metadata:
      labels:
        app: glancy-website
    spec:
      containers:
        - name: website
          image: registry.glancy.xyz/glancy/website:v1.3.0
          ports:
            - containerPort: 80
          envFrom:
            - configMapRef:
                name: glancy-backend-config
          readinessProbe:
            httpGet:
              path: /healthz
              port: 80
            periodSeconds: 10
          livenessProbe:
            httpGet:
              path: /healthz
              port: 80
            initialDelaySeconds: 30
```
`/healthz` 可通过 Nginx `location /healthz { return 200 'ok'; }` 暴露。

## 5. 发布与回滚流程
1. **滚动发布**：
   ```bash
   kubectl -n glancy-staging set image deployment/glancy-backend backend=registry.glancy.xyz/glancy/backend:v1.3.1
   kubectl -n glancy-staging rollout status deployment/glancy-backend --timeout=120s
   ```
2. **零停机保障**：
   - `maxUnavailable=0` + `readinessProbe` 确保新 Pod 未就绪不会摘旧版本。
   - 可在 `kubectl` 命令后附加 `--record`，方便审计。
   - 如需金丝雀，可配置 `replicas=4`，先调整 `Deployment` 使 `maxSurge=2` 并减少 `service` 指向旧 Pod。
3. **回滚**：
   ```bash
   kubectl -n glancy-staging rollout undo deployment/glancy-backend
   kubectl -n glancy-staging rollout status deployment/glancy-backend
   ```
4. **配置变更**：修改 ConfigMap/Secret 后执行：
   ```bash
   kubectl -n glancy-staging rollout restart deployment/glancy-backend
   ```
5. **验证**：
   - `kubectl logs deployment/glancy-backend -f` 无异常。
   - `kubectl exec` 访问 `/actuator/info` 确认版本。
   - 观测平台检查新的 `service.version` 标签。

## 6. HPA 与弹性
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: glancy-backend
  namespace: glancy-staging
spec:
  minReplicas: 3
  maxReplicas: 8
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 60
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: glancy-backend
```
> 弹性扩容时记得同步数据库、对象存储、第三方 API 配额限制，确保不会触发 Doubao/Volcengine 的流控。

## 7. 运行中巡检
- `kubectl get events -A | grep glancy`：排查探针失败。
- `kubectl describe ingress glancy-backend`：确认证书与 WAF 注解已生效。
- `kubectl top pod -n glancy-prod`：观测资源使用并调整 requests/limits。
- 定期校验 `Secret` 的 `creationTimestamp` 以符合 90 天轮转要求。

通过以上步骤可以让 Backend 与 Website 在 K8s 上按标准探针、滚动策略与回滚流程运行，实现“可复制、可回滚”的上线能力。
