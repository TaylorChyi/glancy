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

export const createDataSectionViewModel = ({
  title,
  headingId,
  description,
  ids,
  copy,
  historyToggle,
  retentionControl,
  languageControl,
  actionsControl,
  isActionPending,
}: CreateDataSectionViewModelArgs): DataSectionViewModel => {
  const fields: DataFieldModel[] = [
    {
      key: "history",
      type: "history",
      props: { fieldId: ids.toggle, copy: copy.toggle, control: historyToggle },
    },
    {
      key: "retention",
      type: "retention",
      props: {
        fieldId: ids.retention,
        copy: copy.retention,
        control: retentionControl,
        isPending: isActionPending(retentionControl.pendingId),
      },
    },
    {
      key: "language",
      type: "language",
      props: {
        fieldId: ids.language,
        copy: languageControl.copy,
        control: languageControl,
        isPending: isActionPending(languageControl.pendingId),
      },
    },
    {
      key: "actions",
      type: "actions",
      props: {
        copy: actionsControl.copy,
        control: actionsControl,
        isClearingAll: isActionPending(actionsControl.pendingId),
      },
    },
  ];

  return {
    section: {
      headingId,
      title,
      description: description.section,
      descriptionId: description.id,
    },
    fields,
  };
};
