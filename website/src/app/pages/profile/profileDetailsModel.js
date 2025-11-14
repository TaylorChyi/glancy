export const CORE_FIELDS = [
  "job",
  "education",
  "interests",
  "goal",
  "currentAbility",
  "responseStyle",
];

export function createLocalId(prefix = "profile") {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  const random = Math.random().toString(36).slice(2);
  return `${prefix}-${Date.now()}-${random}`;
}

export function createCustomItem(partial = {}) {
  return {
    id: partial.id ?? createLocalId("profile-item"),
    label: partial.label ?? "",
    value: partial.value ?? "",
  };
}

export function createCustomSection(partial = {}) {
  const items = (partial.items ?? []).map((item) => createCustomItem(item));
  return {
    id: partial.id ?? createLocalId("profile-section"),
    title: partial.title ?? "",
    items: items.length > 0 ? items : [createCustomItem()],
  };
}

export function createEmptyProfileDetails() {
  return {
    job: "",
    education: "",
    interests: "",
    goal: "",
    currentAbility: "",
    responseStyle: "",
    customSections: [],
  };
}

export function profileDetailsReducer(state, action) {
  switch (action.type) {
    case "hydrate": {
      return {
        ...state,
        ...action.payload,
      };
    }
    case "updateField": {
      if (!CORE_FIELDS.includes(action.field)) {
        return state;
      }
      return {
        ...state,
        [action.field]: action.value,
      };
    }
    case "setCustomSections": {
      return {
        ...state,
        customSections: action.sections.map((section) =>
          createCustomSection(section),
        ),
      };
    }
    default:
      return state;
  }
}

export function mapResponseToProfileDetails(response) {
  if (!response) {
    return createEmptyProfileDetails();
  }
  const base = createEmptyProfileDetails();
  return {
    ...base,
    job: response.job ?? "",
    education: response.education ?? "",
    interests: response.interest ?? "",
    goal: response.goal ?? "",
    currentAbility: response.currentAbility ?? "",
    responseStyle: response.responseStyle ?? "",
    customSections: (response.customSections ?? []).map((section) =>
      createCustomSection({
        title: section.title,
        items: (section.items ?? []).map((item) => ({
          label: item.label,
          value: item.value,
        })),
      }),
    ),
  };
}

export function sanitizeProfileText(value) {
  if (typeof value !== "string") return "";
  return value.trim();
}

export function normalizeCoreProfileFields(details) {
  return {
    job: sanitizeProfileText(details.job),
    interest: sanitizeProfileText(details.interests),
    goal: sanitizeProfileText(details.goal),
    education: sanitizeProfileText(details.education),
    currentAbility: sanitizeProfileText(details.currentAbility),
    responseStyle: sanitizeProfileText(details.responseStyle),
  };
}

export function normalizeCustomProfileItem(item) {
  const label = sanitizeProfileText(item?.label);
  const value = sanitizeProfileText(item?.value);
  if (!label && !value) {
    return null;
  }
  return { label, value };
}

export function normalizeCustomProfileSection(section = {}) {
  const title = sanitizeProfileText(section.title);
  const items = (section.items ?? [])
    .map((item) => normalizeCustomProfileItem(item))
    .filter(Boolean);
  if (!title && items.length === 0) {
    return null;
  }
  return { title, items };
}

export function normalizeCustomProfileSections(sections = []) {
  return sections
    .map((section) => normalizeCustomProfileSection(section))
    .filter(Boolean);
}

export function mapNormalizedFieldsToRequestPayload({
  coreFields,
  customSections,
}) {
  return {
    job: coreFields.job || null,
    interest: coreFields.interest || null,
    goal: coreFields.goal || null,
    education: coreFields.education || null,
    currentAbility: coreFields.currentAbility || null,
    responseStyle: coreFields.responseStyle || null,
    customSections,
  };
}

export function mapProfileDetailsToRequest(details) {
  const coreFields = normalizeCoreProfileFields(details);
  const customSections = normalizeCustomProfileSections(
    details.customSections ?? [],
  );
  return mapNormalizedFieldsToRequestPayload({
    coreFields,
    customSections,
  });
}
