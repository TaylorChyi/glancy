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

function sanitizeText(value) {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  return trimmed;
}

export function mapProfileDetailsToRequest(details) {
  const normalized = {
    job: sanitizeText(details.job),
    interest: sanitizeText(details.interests),
    goal: sanitizeText(details.goal),
    education: sanitizeText(details.education),
    currentAbility: sanitizeText(details.currentAbility),
    responseStyle: sanitizeText(details.responseStyle),
    customSections: (details.customSections ?? [])
      .map((section) => {
        const title = sanitizeText(section.title);
        const items = (section.items ?? [])
          .map((item) => ({
            label: sanitizeText(item.label),
            value: sanitizeText(item.value),
          }))
          .filter((item) => item.label || item.value);
        if (!title && items.length === 0) {
          return null;
        }
        return {
          title,
          items,
        };
      })
      .filter(Boolean),
  };

  return {
    job: normalized.job || null,
    interest: normalized.interest || null,
    goal: normalized.goal || null,
    education: normalized.education || null,
    currentAbility: normalized.currentAbility || null,
    responseStyle: normalized.responseStyle || null,
    customSections: normalized.customSections,
  };
}
