type ResponseStyleState = {
  status?: string;
  values?: Record<string, string>;
  savingField?: string | null;
  error?: string | null;
};

type ResponseStyleStateSnapshot = {
  status: string;
  values: Record<string, string>;
  savingField: string | null;
  hasLoadedValues: boolean;
};

type ResponseStyleCopyField = {
  id: string;
  label: string;
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
};

type ResponseStyleCopy = {
  loadingLabel: string;
  errorLabel: string;
  retryLabel: string;
  dropdownLabel: string;
  options: Array<{ value: string; label: string }>;
  fields: ResponseStyleCopyField[];
  savingLabel: string;
};

type ResponseStyleHandlers = {
  onRetry?: () => void;
  onFieldChange: (fieldId: string, value: string) => void;
  onFieldCommit: (fieldId: string) => void;
};

export type ResponseStyleSectionViewModel = {
  section: {
    title: string;
    headingId: string;
    description?: string;
    descriptionId?: string;
  };
  placeholder: { visible: boolean; label: string };
  error: { visible: boolean; label: string; retryLabel: string; onRetry?: () => void };
  dropdown: {
    selectId: string;
    label: string;
    options: Array<{ value: string; label: string }>;
    value: string;
    onSelect: (value: string) => void;
    isSaving: boolean;
  } | null;
  fields: Array<{
    inputId: string;
    label: string;
    placeholder?: string;
    multiline?: boolean;
    rows?: number;
    value: string;
    onChange: (event: unknown) => void;
    onBlur: () => void;
    isSaving: boolean;
  }>;
  savingLabel: string;
};

type CreateResponseStyleSectionViewModelArgs = {
  title: string;
  headingId: string;
  description?: string;
  descriptionId?: string;
  state: ResponseStyleState;
  copy: ResponseStyleCopy;
  handlers: ResponseStyleHandlers;
};

const resolveValues = (state: ResponseStyleState) => state.values ?? {};

const createFieldChangeHandler =
  (handlers: ResponseStyleHandlers, fieldId: string) => (event: unknown) => {
    if (event && typeof event === "object" && "target" in event) {
      const target = (event as { target?: { value?: string } }).target;
      handlers.onFieldChange(fieldId, target?.value ?? "");
      return;
    }
    handlers.onFieldChange(fieldId, String(event ?? ""));
  };

const createDropdownSelectHandler =
  (handlers: ResponseStyleHandlers, fieldId: string) => (value: string) => {
    handlers.onFieldChange(fieldId, value ?? "");
    handlers.onFieldCommit(fieldId);
  };

const createStateSnapshot = (state: ResponseStyleState): ResponseStyleStateSnapshot => {
  const status = state?.status ?? "idle";
  const values = resolveValues(state);
  const savingField = state?.savingField ?? null;
  const hasLoadedValues = Object.keys(values).length > 0;
  return { status, values, savingField, hasLoadedValues };
};

const shouldShowPlaceholder = (snapshot: ResponseStyleStateSnapshot) =>
  (snapshot.status === "idle" || snapshot.status === "loading") &&
  !snapshot.hasLoadedValues;

type PresentationContext = {
  copy: ResponseStyleCopy;
  handlers: ResponseStyleHandlers;
  state: ResponseStyleStateSnapshot;
};

const buildDropdownViewModel = ({
  copy,
  handlers,
  state,
}: PresentationContext) => {
  if (!state.hasLoadedValues) {
    return null;
  }
  const fieldId = "responseStyle";
  return {
    selectId: "response-style-select",
    label: copy.dropdownLabel,
    options: copy.options,
    value: state.values[fieldId] ?? "",
    onSelect: createDropdownSelectHandler(handlers, fieldId),
    isSaving:
      state.savingField === fieldId && state.status === "saving",
  };
};

type FieldFactoryContext = {
  handlers: ResponseStyleHandlers;
  values: Record<string, string>;
  savingField: string | null;
  status: string;
};

const createFieldViewModelFactory = ({
  handlers,
  values,
  savingField,
  status,
}: FieldFactoryContext) =>
  (field: ResponseStyleCopyField) => ({
    inputId: `${field.id}-input`,
    label: field.label,
    placeholder: field.placeholder,
    multiline: field.multiline,
    rows: field.rows,
    value: values[field.id] ?? "",
    onChange: createFieldChangeHandler(handlers, field.id),
    onBlur: () => handlers.onFieldCommit(field.id),
    isSaving: savingField === field.id && status === "saving",
  });

const buildFieldViewModels = ({
  copy,
  handlers,
  state,
}: PresentationContext) => {
  if (!state.hasLoadedValues) {
    return [];
  }
  const factory = createFieldViewModelFactory({
    handlers,
    values: state.values,
    savingField: state.savingField,
    status: state.status,
  });
  return (copy.fields ?? []).map(factory);
};

const buildErrorState = (
  state: ResponseStyleState,
  copy: ResponseStyleCopy,
  handlers: ResponseStyleHandlers,
) => ({
  visible: Boolean(state?.error),
  label: state?.error ?? copy.errorLabel,
  retryLabel: copy.retryLabel,
  onRetry: handlers.onRetry,
});

const buildSectionMetadata = ({
  title,
  headingId,
  description,
  descriptionId,
}: {
  title: string;
  headingId: string;
  description?: string;
  descriptionId?: string;
}) => ({ title, headingId, description, descriptionId });

const buildPlaceholderState = ({
  copy,
  state,
}: {
  copy: ResponseStyleCopy;
  state: ResponseStyleStateSnapshot;
}) => ({
  visible: shouldShowPlaceholder(state),
  label: copy.loadingLabel,
});

export const createResponseStyleSectionViewModel = ({
  title,
  headingId,
  description,
  descriptionId,
  state,
  copy,
  handlers,
}: CreateResponseStyleSectionViewModelArgs): ResponseStyleSectionViewModel => {
  const snapshot = createStateSnapshot(state);
  const dropdown = buildDropdownViewModel({ copy, handlers, state: snapshot });
  const fields = buildFieldViewModels({ copy, handlers, state: snapshot });

  return {
    section: buildSectionMetadata({ title, headingId, description, descriptionId }),
    placeholder: buildPlaceholderState({ copy, state: snapshot }),
    error: buildErrorState(state, copy, handlers),
    dropdown,
    fields,
    savingLabel: copy.savingLabel,
  };
};
