export function createFieldDefinition({ key, icon, label, placeholder, help }) {
  return { key, icon, label, placeholder, help };
}

export function createBackgroundFields(t) {
  return [
    createFieldDefinition({
      key: "education",
      icon: "library",
      label: t.educationLabel,
      placeholder: t.educationPlaceholder,
      help: t.educationHelp,
    }),
    createFieldDefinition({
      key: "job",
      icon: "command-line",
      label: t.jobLabel,
      placeholder: t.jobPlaceholder,
      help: t.jobHelp,
    }),
  ];
}

export function createGrowthFields(t) {
  return [
    createFieldDefinition({
      key: "interests",
      icon: "star-outline",
      label: t.interestsLabel,
      placeholder: t.interestsPlaceholder,
      help: t.interestsHelp,
    }),
    createFieldDefinition({
      key: "goal",
      icon: "flag",
      label: t.goalLabel,
      placeholder: t.goalPlaceholder,
      help: t.goalHelp,
    }),
    createFieldDefinition({
      key: "currentAbility",
      icon: "shield-check",
      label: t.currentAbilityLabel,
      placeholder: t.currentAbilityPlaceholder,
      help: t.currentAbilityHelp,
    }),
  ];
}

export function createProfileFieldGroups(t) {
  return [
    { key: "background", fields: createBackgroundFields(t) },
    { key: "growth", fields: createGrowthFields(t) },
  ];
}
