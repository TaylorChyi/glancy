const createFieldConfig = ({ key, icon, label, placeholder, help }) => ({
  key,
  icon,
  label,
  placeholder,
  help,
});

export const createBackgroundFields = (t) => [
  createFieldConfig({
    key: "education",
    icon: "library",
    label: t.educationLabel,
    placeholder: t.educationPlaceholder,
    help: t.educationHelp,
  }),
  createFieldConfig({
    key: "job",
    icon: "command-line",
    label: t.jobLabel,
    placeholder: t.jobPlaceholder,
    help: t.jobHelp,
  }),
];

export const createGrowthFields = (t) => [
  createFieldConfig({
    key: "interests",
    icon: "star-outline",
    label: t.interestsLabel,
    placeholder: t.interestsPlaceholder,
    help: t.interestsHelp,
  }),
  createFieldConfig({
    key: "goal",
    icon: "flag",
    label: t.goalLabel,
    placeholder: t.goalPlaceholder,
    help: t.goalHelp,
  }),
  createFieldConfig({
    key: "currentAbility",
    icon: "shield-check",
    label: t.currentAbilityLabel,
    placeholder: t.currentAbilityPlaceholder,
    help: t.currentAbilityHelp,
  }),
];

export const createFieldGroup = (key, fields) => ({
  key,
  fields,
});

export const createBackgroundGroup = (t) =>
  createFieldGroup("background", createBackgroundFields(t));

export const createGrowthGroup = (t) =>
  createFieldGroup("growth", createGrowthFields(t));

export function createProfileFieldGroups(t) {
  return [createBackgroundGroup(t), createGrowthGroup(t)];
}
