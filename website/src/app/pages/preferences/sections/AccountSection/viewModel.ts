type AvatarInteraction = {
  avatarInputId: string;
  avatarInputRef: {
    current: HTMLInputElement | null;
  };
  onAvatarTrigger: () => void;
  onAvatarChange: (event: unknown) => void;
};

type NormalizedIdentity = {
  label?: string;
  displayName: string;
  changeLabel: string;
  avatarAlt?: string;
  isUploading?: boolean;
};

type AccountSectionViewModelArgs = {
  title: string;
  headingId: string;
  fields: unknown[];
  bindings: unknown;
  identity: NormalizedIdentity;
  avatarInteraction: AvatarInteraction;
};

export type AccountSectionViewModel = {
  section: {
    title: string;
    headingId: string;
  };
  identity: NormalizedIdentity &
    AvatarInteraction & {
      avatarSize: number;
    };
  fields: unknown[];
  bindings: unknown;
};

const AVATAR_SIZE = 72;

export const createAccountSectionViewModel = ({
  title,
  headingId,
  fields,
  bindings,
  identity,
  avatarInteraction,
}: AccountSectionViewModelArgs): AccountSectionViewModel => ({
  section: { title, headingId },
  identity: {
    ...identity,
    avatarSize: AVATAR_SIZE,
    avatarInputId: avatarInteraction.avatarInputId,
    avatarInputRef: avatarInteraction.avatarInputRef,
    onAvatarTrigger: avatarInteraction.onAvatarTrigger,
    onAvatarChange: avatarInteraction.onAvatarChange,
  },
  fields,
  bindings,
});
