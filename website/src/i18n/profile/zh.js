export default {
  profileTitle: "个人资料",
  avatar: "头像",
  avatarHint: "点击更换头像",
  saveButton: "保存",
  saveSuccess: "保存成功",
  cancelButton: "取消",
  emailBindingTitle: "邮箱绑定",
  emailBoundDescription:
    "绑定的邮箱可用于安全通知与快速登录，守护你的账户资产。",
  emailUnboundDescription:
    "尚未绑定邮箱，完成绑定即可启用验证码登录与找回功能。",
  emailStatusBound: "已绑定",
  emailStatusUnbound: "未绑定",
  emailInputLabel: "新邮箱",
  emailInputPlaceholder: "example@domain.com",
  emailCodeLabel: "验证码",
  emailCodePlaceholder: "输入验证码",
  emailSendCode: "发送验证码",
  emailSendingCode: "发送中…",
  emailVerifying: "验证中…",
  emailConfirm: "确认换绑",
  emailCancel: "取消",
  emailCurrentLabel: "当前邮箱",
  emailEmptyValue: "未绑定",
  emailChangeAction: "更换邮箱",
  emailUnbindAction: "解绑邮箱",
  emailUnbinding: "解绑中…",
  emailVerificationIntro: "我们仅接受通过验证的邮箱，请先发送验证码。",
  emailAwaitingCode: "请先发送验证码以继续下一步。",
  emailVerificationPending:
    "验证码已发送至 {{email}}，请在 10 分钟内完成验证。",
  emailVerificationMismatch:
    "最新验证码发送到 {{email}}，请保持一致或重新发送。",
  emailStepInput: "填写邮箱",
  emailStepVerify: "验证邮箱",
  emailCodeSent: "验证码已发送，请查收邮件。",
  emailChangeSuccess: "邮箱换绑成功。",
  emailUnbindSuccess: "邮箱已解绑，之后无法通过邮箱登录。",
  emailInputRequired: "请先填写有效的新邮箱地址。",
  emailSameAsCurrent: "新邮箱不能与当前邮箱相同。",
  emailCodeRequired: "请输入验证码。",
  emailCodeNotRequested: "请先获取验证码，再提交换绑。",
  emailCodeMismatch: "请使用收到验证码的邮箱地址完成换绑。",
  educationLabel: "学历",
  educationPlaceholder: "如：本科 / 计算机科学",
  educationHelp: "用于帮助导师快速了解你的理论基础。",
  jobLabel: "职业",
  jobPlaceholder: "如：产品经理 / 在读研究生",
  jobHelp: "告诉我们你的日常语境，便于定制练习场景。",
  currentAbilityLabel: "当前能力",
  currentAbilityPlaceholder: "如：雅思 6.5 / 能进行商务演示",
  currentAbilityHelp: "描述你对语言或技能的掌握程度，便于匹配内容难度。",
  customSections: {
    learningPlan: {
      title: "学习计划",
      description: "记录阶段性目标和节奏，系统会据此安排提醒。",
      items: {
        milestone: {
          label: "关键里程碑",
          placeholder: "例如：第 4 周完成行业演示稿",
        },
        cadence: {
          label: "学习节奏",
          placeholder: "如：工作日 1 小时，周末复盘",
        },
      },
    },
    resourcePreference: {
      title: "资源偏好",
      description: "说明你更喜欢的学习素材或形式。",
      items: {
        primary: {
          label: "首选资源",
          placeholder: "如：播客 / 会议纪要",
        },
        secondary: {
          label: "备选资源",
          placeholder: "如：原版书籍 / 视频课程",
        },
      },
    },
    practiceScenarios: {
      title: "实践场景",
      description: "描述你将在何种场合使用语言或技能。",
      items: {
        realWorld: {
          label: "真实场景",
          placeholder: "如：每周产品例会",
        },
        collaboration: {
          label: "协作对象",
          placeholder: "如：海外设计团队",
        },
      },
    },
  },
};
