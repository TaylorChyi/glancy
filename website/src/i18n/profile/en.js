export default {
  profileTitle: "Profile",
  avatar: "Avatar",
  avatarHint: "Click to change avatar",
  saveButton: "Save",
  saveSuccess: "Save success",
  cancelButton: "Cancel",
  emailBindingTitle: "Email binding",
  emailBoundDescription:
    "Use your trusted email to receive secure notifications and sign in effortlessly.",
  emailUnboundDescription:
    "Bind an email address to unlock verification login and account recovery.",
  emailStatusBound: "Bound",
  emailStatusUnbound: "Unbound",
  emailInputLabel: "New email",
  emailInputPlaceholder: "example@domain.com",
  emailCodeLabel: "Verification code",
  emailCodePlaceholder: "Enter code",
  emailSendCode: "Send code",
  emailSendingCode: "Sending…",
  emailVerifying: "Verifying…",
  emailConfirm: "Confirm",
  emailCancel: "Cancel",
  emailCurrentLabel: "Current email",
  emailEmptyValue: "Not linked",
  emailChangeAction: "Change email",
  emailUnbindAction: "Unbind email",
  emailUnbinding: "Removing…",
  emailVerificationIntro:
    "We only accept verified inboxes. Request a code to continue.",
  emailAwaitingCode: "Request a verification code to continue.",
  emailVerificationPending:
    "Code sent to {{email}}. Enter it within 10 minutes to confirm.",
  emailVerificationMismatch:
    "The latest code was sent to {{email}}. Update or resend to proceed.",
  emailStepInput: "New email",
  emailStepVerify: "Verify",
  emailCodeSent: "Verification code sent, please check your inbox.",
  emailChangeSuccess: "Email updated successfully.",
  emailUnbindSuccess: "Email unbound. You can no longer sign in with email.",
  emailInputRequired: "Please provide a valid email address first.",
  emailSameAsCurrent: "The new email must be different from the current one.",
  emailCodeRequired: "Please enter the verification code.",
  emailCodeNotRequested:
    "Please request a verification code before submitting.",
  emailCodeMismatch:
    "Please use the email that received the verification code.",
  educationLabel: "Education",
  educationPlaceholder: "e.g. Bachelor's in Computer Science",
  educationHelp: "Helps mentors understand your theoretical background.",
  jobLabel: "Occupation",
  jobPlaceholder: "e.g. Product Manager / Graduate Student",
  jobHelp: "Share your daily context to customise practice scenarios.",
  currentAbilityLabel: "Current ability",
  currentAbilityPlaceholder: "e.g. IELTS 6.5 / Confident in business demos",
  currentAbilityHelp: "Describe your proficiency so we can match difficulty.",
  customSections: {
    learningPlan: {
      title: "Learning plan",
      description: "Capture milestones and rhythms to drive timely nudges.",
      items: {
        milestone: {
          label: "Key milestone",
          placeholder: "e.g. Deliver industry deck by week 4",
        },
        cadence: {
          label: "Study cadence",
          placeholder: "e.g. 1 hour on weekdays, weekend retrospectives",
        },
      },
    },
    resourcePreference: {
      title: "Resource preference",
      description: "Tell us which formats energise you most.",
      items: {
        primary: {
          label: "Primary resource",
          placeholder: "e.g. Podcasts / meeting minutes",
        },
        secondary: {
          label: "Secondary resource",
          placeholder: "e.g. Original books / video courses",
        },
      },
    },
    practiceScenarios: {
      title: "Practice scenarios",
      description: "Describe where you'll apply the skill in real life.",
      items: {
        realWorld: {
          label: "Real-world setting",
          placeholder: "e.g. Weekly product sync",
        },
        collaboration: {
          label: "Collaboration partners",
          placeholder: "e.g. Global design team",
        },
      },
    },
  },
};
