type DataSectionDescription = {
  section?: string;
  id?: string;
};

type DataFieldType = "history" | "retention" | "language" | "actions";

type DataFieldModel = {
  key: string;
  type: DataFieldType;
  props: Record<string, unknown>;
};

type PendingChecker = (pendingId?: string | null) => boolean;

type CreateDataSectionViewModelArgs = {
  title: string;
  headingId: string;
  description: DataSectionDescription;
  ids: {
    toggle: string;
    retention: string;
    language: string;
  };
  copy: Record<string, unknown>;
  historyToggle: Record<string, unknown>;
  retentionControl: Record<string, unknown> & { pendingId?: string };
  languageControl: Record<string, unknown> & { pendingId?: string };
  actionsControl: Record<string, unknown> & { pendingId?: string };
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

type FieldBuilderArgs = Pick<
  CreateDataSectionViewModelArgs,
  | "ids"
  | "copy"
  | "historyToggle"
  | "retentionControl"
  | "languageControl"
  | "actionsControl"
  | "isActionPending"
>;

const buildHistoryField = ({ ids, copy, historyToggle }: FieldBuilderArgs) => ({
  key: "history",
  type: "history" as const,
  props: { fieldId: ids.toggle, copy: copy.toggle, control: historyToggle },
});

const buildRetentionField = ({
  ids,
  copy,
  retentionControl,
  isActionPending,
}: FieldBuilderArgs) => ({
  key: "retention",
  type: "retention" as const,
  props: {
    fieldId: ids.retention,
    copy: copy.retention,
    control: retentionControl,
    isPending: isActionPending(retentionControl.pendingId),
  },
});

const buildLanguageField = ({
  ids,
  languageControl,
  isActionPending,
}: FieldBuilderArgs) => ({
  key: "language",
  type: "language" as const,
  props: {
    fieldId: ids.language,
    copy: languageControl.copy,
    control: languageControl,
    isPending: isActionPending(languageControl.pendingId),
  },
});

const buildActionsField = ({ actionsControl, isActionPending }: FieldBuilderArgs) => ({
  key: "actions",
  type: "actions" as const,
  props: {
    copy: actionsControl.copy,
    control: actionsControl,
    isClearingAll: isActionPending(actionsControl.pendingId),
  },
});

const buildFields = (args: FieldBuilderArgs): DataFieldModel[] => [
  buildHistoryField(args),
  buildRetentionField(args),
  buildLanguageField(args),
  buildActionsField(args),
];

const buildSection = ({
  headingId,
  title,
  description,
}: Pick<CreateDataSectionViewModelArgs, "headingId" | "title" | "description">) => ({
  headingId,
  title,
  description: description.section,
  descriptionId: description.id,
});

export const createDataSectionViewModel = (
  args: CreateDataSectionViewModelArgs,
): DataSectionViewModel => ({
  section: buildSection(args),
  fields: buildFields(args),
});
