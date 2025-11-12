# K8s 部署手册

> 适用环境：`glancy-staging`、`glancy-prod`。目标是提供完整的资源清单、健康探针、零停机发布与回滚策略，让集群部署具备可复制性。

## 1. 集群基线
1. **命名空间**：分别使用 `glancy-staging` 与 `glancy-prod`，禁止跨命名空间引用 Secret/ConfigMap。
2. **节点池**：
   - Backend：2 vCPU / 4 GiB 起步，建议开启自动扩缩容。
   - Website：1 vCPU / 2 GiB 即可，可使用 Spot 节点。
3. **存储与日志**：
   - 业务日志接入阿里云 SLS 或通过 Sidecar 推送；如需落地磁盘，可使用 `emptyDir` + Log agent。
   - TTS 自定义配置可通过 `ConfigMap` 投射至 `/etc/glancy/tts`。
4. **入口**：
   - API：Ingress + WAF，域名 `api.<env>.glancy.xyz`。
   - Web：Ingress + CDN/Edge；若静态托管在 OSS，可仅保留回源服务。
5. **权限**：通过 RAM + ServiceAccount 绑定，授予访问 Secrets Manager/OSS 的最小权限。

## 2. 基础配置资源
### 2.1 ConfigMap 示例
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
  dataVersion: "v1.4.0"
```

### 2.2 Secret 示例
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: glancy-backend-secret
  namespace: glancy-staging
  labels:
    app: glancy-backend
stringData:
  DB_PASSWORD: "********"
  GLANCY_SMTP_PASSWORD: "********"
  THIRDPARTY_DOUBAO_API_KEY: "volces-***"
  OSS_ACCESS_KEY_ID: "LTAI***"
  OSS_ACCESS_KEY_SECRET: "***"
  OSS_SECURITY_TOKEN: "***"
  VOLCENGINE_APP_ID: "***"
  VOLCENGINE_ACCESS_TOKEN: "***"
  dataVersion: "v1.4.0"
```
> 建议配合 GitOps（ArgoCD/Flux）+ SOPS 管理密文，所有变更以 PR 形式审计。

## 3. Backend 工作负载
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
      annotations:
        checksum/config: "{{ sha256sum ConfigMap glancy-backend-config }}"
        checksum/secret: "{{ sha256sum Secret glancy-backend-secret }}"
    spec:
      serviceAccountName: glancy-backend
      containers:
        - name: backend
          image: registry.glancy.xyz/glancy/backend:v1.4.0
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
> 如 Actuator 未开启细分探针，请在 ConfigMap 中设置 `MANAGEMENT_ENDPOINT_HEALTH_PROBES_ENABLED=true`。

### 3.1 Service 与 Ingress
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
    nginx.ingress.kubernetes.io/backend-protocol: "HTTP"
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

## 4. Website 工作负载（可选）
若静态站点通过 OSS/CDN 发布，可跳过此节。若需集群托管：
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
          image: registry.glancy.xyz/glancy/website:v1.4.0
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
> `/healthz` 可通过 Nginx `location /healthz { return 200 'ok'; }` 实现。

## 5. 发布与回滚流程
1. **滚动发布**：
   ```bash
   kubectl -n glancy-staging set image deployment/glancy-backend backend=registry.glancy.xyz/glancy/backend:v1.4.1
   kubectl -n glancy-staging rollout status deployment/glancy-backend --timeout=180s
   ```
2. **零停机保障**：`maxUnavailable=0` + Readiness Probe 确保新 Pod 未就绪不会摘除旧实例；可借助 Service Mesh/灰度入口实现金丝雀。
3. **金丝雀发布（可选）**：临时将 `replicas=4`，把新版本副本数限制在 1-2，结合 Ingress 权重或 Service Mesh 调度小流量。
4. **回滚**：
   ```bash
   kubectl -n glancy-staging rollout undo deployment/glancy-backend
   kubectl -n glancy-staging rollout status deployment/glancy-backend
   ```
5. **配置变更**：更新 ConfigMap/Secret 后执行 `kubectl -n glancy-staging rollout restart deployment/glancy-backend` 并观察探针。
6. **验证清单**：
   - `kubectl logs deployment/glancy-backend -f` 无异常栈。
   - `kubectl exec` 调用 `/actuator/info` 核对版本号。
   - 观测平台（Prometheus/SLS）显示新版本指标正常。

## 6. 弹性伸缩
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
> 当触发扩容时请检查数据库、OSS、第三方 API 的配额限制，防止超额调用。

## 7. 运行期巡检
- `kubectl get events -n glancy-staging | grep glancy`：排查探针失败与重启原因。
- `kubectl describe ingress glancy-backend`：确认证书与 WAF 注解生效。
- `kubectl top pod -n glancy-prod`：监控资源使用，及时调整 `requests/limits`。
- 定期校验 Secret 的 `dataVersion` 与 `doc/deploy/Envs.md` 保持一致，满足 90 天轮转要求。

按照本手册准备资源与操作，即可在 K8s 集群中完成标准化的部署、健康监测、零停机发布与快速回滚。
