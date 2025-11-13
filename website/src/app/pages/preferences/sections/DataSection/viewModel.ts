type DataSectionDescription = {
  section?: string;
  id?: string;
};

type FieldCopy = Record<string, unknown>;

type DataFieldType = "history" | "retention" | "language" | "actions";

type DataFieldModel = {
  key: string;
  type: DataFieldType;
  props: Record<string, unknown>;
};

type PendingChecker = (pendingId?: string | null) => boolean;

type PendingAwareControl<T extends Record<string, unknown>> = T & {
  pendingId?: string | null;
};

type DataSectionCopy = {
  toggle: FieldCopy;
  retention: FieldCopy;
};

type CreateDataSectionViewModelArgs = {
  title: string;
  headingId: string;
  description: DataSectionDescription;
  ids: {
    toggle: string;
    retention: string;
    language: string;
  };
  copy: DataSectionCopy;
  historyToggle: Record<string, unknown>;
  retentionControl: PendingAwareControl<Record<string, unknown>>;
  languageControl: PendingAwareControl<Record<string, unknown>> & {
    copy: FieldCopy;
  };
  actionsControl: PendingAwareControl<Record<string, unknown>> & {
    copy: FieldCopy;
  };
  isActionPending: PendingChecker;
};

export type DataSectionViewModel = {
  section: {
    headingId: string;
    title: string;
    description?: string;
    descriptionId?: string;
  };
  fields: DataFieldModel[];
};

const isPending = (
  pendingId: string | null | undefined,
  checker: PendingChecker,
) => checker(pendingId ?? undefined);

const createHistoryField = ({
  ids,
  copy,
  historyToggle,
}: Pick<CreateDataSectionViewModelArgs, "ids" | "copy" | "historyToggle">): DataFieldModel => ({
  key: "history",
  type: "history",
  props: { fieldId: ids.toggle, copy: copy.toggle, control: historyToggle },
});

const createRetentionField = ({
  ids,
  copy,
  retentionControl,
  isActionPending,
}: Pick<
  CreateDataSectionViewModelArgs,
  "ids" | "copy" | "retentionControl" | "isActionPending"
>): DataFieldModel => ({
  key: "retention",
  type: "retention",
  props: {
    fieldId: ids.retention,
    copy: copy.retention,
    control: retentionControl,
    isPending: isPending(retentionControl.pendingId, isActionPending),
  },
});

const createLanguageField = ({
  ids,
  languageControl,
  isActionPending,
}: Pick<
  CreateDataSectionViewModelArgs,
  "ids" | "languageControl" | "isActionPending"
>): DataFieldModel => ({
  key: "language",
  type: "language",
  props: {
    fieldId: ids.language,
    copy: languageControl.copy,
    control: languageControl,
    isPending: isPending(languageControl.pendingId, isActionPending),
  },
});

const createActionsField = ({
  actionsControl,
  isActionPending,
}: Pick<
  CreateDataSectionViewModelArgs,
  "actionsControl" | "isActionPending"
>): DataFieldModel => ({
  key: "actions",
  type: "actions",
  props: {
    copy: actionsControl.copy,
    control: actionsControl,
    isClearingAll: isPending(actionsControl.pendingId, isActionPending),
  },
});

const createFields = (args: CreateDataSectionViewModelArgs): DataFieldModel[] => [
  createHistoryField(args),
  createRetentionField(args),
  createLanguageField(args),
  createActionsField(args),
];

const createSection = ({
  headingId,
  title,
  description,
}: Pick<
  CreateDataSectionViewModelArgs,
  "headingId" | "title" | "description"
>): DataSectionViewModel["section"] => ({
  headingId,
  title,
  description: description.section,
  descriptionId: description.id,
});

export const createDataSectionViewModel = (
  args: CreateDataSectionViewModelArgs,
): DataSectionViewModel => ({
  section: createSection(args),
  fields: createFields(args),
});
