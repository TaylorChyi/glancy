export function createProfileFieldGroups(t) {
  return [
    {
      key: "background",
      fields: [
        {
          key: "education",
          icon: "library",
          label: t.educationLabel,
          placeholder: t.educationPlaceholder,
          help: t.educationHelp,
        },
        {
          key: "job",
          icon: "command-line",
          label: t.jobLabel,
          placeholder: t.jobPlaceholder,
          help: t.jobHelp,
        },
      ],
    },
    {
      key: "growth",
      fields: [
        {
          key: "interests",
          icon: "star-outline",
          label: t.interestsLabel,
          placeholder: t.interestsPlaceholder,
          help: t.interestsHelp,
        },
        {
          key: "goal",
          icon: "flag",
          label: t.goalLabel,
          placeholder: t.goalPlaceholder,
          help: t.goalHelp,
        },
        {
          key: "currentAbility",
          icon: "shield-check",
          label: t.currentAbilityLabel,
          placeholder: t.currentAbilityPlaceholder,
          help: t.currentAbilityHelp,
        },
      ],
    },
  ];
}
