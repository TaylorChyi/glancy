type PlanCard = {
  id: string;
  title: string;
  summary: string;
  priceLines: string[];
  state: "current" | "available" | "locked";
  badge: string;
  ctaLabel: string;
  disabled: boolean;
  subscriptionExpiryLine?: string;
};

type FeatureRow = {
  id: string;
  label: string;
  values: Record<string, string>;
};

type PlanRailNav = {
  viewportRef: { current: HTMLDivElement | null };
  showPrevNav: boolean;
  showNextNav: boolean;
  isAtStart: boolean;
  isAtEnd: boolean;
  onPrev: () => void;
  onNext: () => void;
  prevLabel: string;
  nextLabel: string;
};

type SubscriptionHandlers = {
  onPlanSelect: (planId: string, disabled?: boolean) => void;
  onRedeemCodeChange: (event: unknown) => void;
  onRedeem: () => void;
};

type RedeemRefs = {
  inputRef: { current: HTMLInputElement | null };
};

type CreateSubscriptionSectionViewModelArgs = {
  title: string;
  headingId: string;
  descriptionId?: string;
  planCards: PlanCard[];
  featureMatrix: FeatureRow[];
  visiblePlanIds: string[];
  planLabels: Record<string, string>;
  pricingNote: string;
  taxNote: string;
  redeemCopy: {
    title: string;
    placeholder: string;
    buttonLabel: string;
  };
  selectedPlanId: string;
  defaultSelectedPlanId: string;
  formattedRedeemCode: string;
  planRailNav: PlanRailNav;
  handlers: SubscriptionHandlers;
  redeemRefs: RedeemRefs;
};

export type SubscriptionSectionViewModel = {
  section: {
    title: string;
    headingId: string;
    descriptionId?: string;
  };
  planRail: PlanRailNav & {
    cards: PlanCard[];
    selectedPlanId: string;
    onSelect: (planId: string, disabled?: boolean) => void;
  };
  featureMatrix: {
    rows: FeatureRow[];
    visiblePlanIds: string[];
    planLabels: Record<string, string>;
    featureColumnLabel: string;
    currentPlanId: string;
  };
  footnotes: {
    pricingNote: string;
    taxNote: string;
  };
  redeemForm: {
    title: string;
    placeholder: string;
    value: string;
    onChange: (event: unknown) => void;
    onRedeem: () => void;
    buttonLabel: string;
    inputRef: { current: HTMLInputElement | null };
  };
};

type ViewModelArgs = CreateSubscriptionSectionViewModelArgs & {
  featureColumnLabel?: string;
};

const createSection = ({
  title,
  headingId,
  descriptionId,
}: ViewModelArgs): SubscriptionSectionViewModel["section"] => ({
  title,
  headingId,
  descriptionId,
});

const createPlanRail = ({
  planRailNav,
  planCards,
  selectedPlanId,
  handlers,
}: ViewModelArgs): SubscriptionSectionViewModel["planRail"] => ({
  ...planRailNav,
  cards: planCards,
  selectedPlanId,
  onSelect: handlers.onPlanSelect,
});

const createFeatureMatrix = ({
  featureMatrix,
  visiblePlanIds,
  planLabels,
  featureColumnLabel,
  defaultSelectedPlanId,
}: ViewModelArgs): SubscriptionSectionViewModel["featureMatrix"] => ({
  rows: featureMatrix,
  visiblePlanIds,
  planLabels,
  featureColumnLabel: featureColumnLabel ?? "",
  currentPlanId: defaultSelectedPlanId,
});

const createFootnotes = ({
  pricingNote,
  taxNote,
}: ViewModelArgs): SubscriptionSectionViewModel["footnotes"] => ({
  pricingNote,
  taxNote,
});

const createRedeemForm = ({
  redeemCopy,
  formattedRedeemCode,
  handlers,
  redeemRefs,
}: ViewModelArgs): SubscriptionSectionViewModel["redeemForm"] => ({
  title: redeemCopy.title,
  placeholder: redeemCopy.placeholder,
  value: formattedRedeemCode,
  onChange: handlers.onRedeemCodeChange,
  onRedeem: handlers.onRedeem,
  buttonLabel: redeemCopy.buttonLabel,
  inputRef: redeemRefs.inputRef,
});

export const createSubscriptionSectionViewModel = (
  args: ViewModelArgs,
): SubscriptionSectionViewModel => ({
  section: createSection(args),
  planRail: createPlanRail(args),
  featureMatrix: createFeatureMatrix(args),
  footnotes: createFootnotes(args),
  redeemForm: createRedeemForm(args),
});
