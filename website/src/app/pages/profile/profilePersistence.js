import { mapProfileDetailsToRequest } from "./profileDetailsModel.js";

export async function updateContactIfChanged({ api, currentUser, phone }) {
  if (!currentUser) {
    throw new Error("currentUser is required to update contact information");
  }

  if (phone === currentUser.phone) {
    return { hasIdentityUpdates: false, nextUser: currentUser };
  }

  const { phone: updatedPhone } = await api.users.updateContact({
    userId: currentUser.id,
    email: currentUser.email,
    phone,
    token: currentUser.token,
  });

  return {
    hasIdentityUpdates: true,
    nextUser: {
      ...currentUser,
      phone: updatedPhone,
    },
  };
}

export function createProfileSavePayload({ details, persistedMeta }) {
  const profilePayload = mapProfileDetailsToRequest(details);

  return {
    ...profilePayload,
    dailyWordTarget: persistedMeta.dailyWordTarget,
    futurePlan: persistedMeta.futurePlan,
  };
}

export async function saveProfileDetails({ api, currentUser, profile }) {
  await api.profiles.saveProfile({
    token: currentUser.token,
    profile,
  });
}

export async function persistProfile({
  api,
  currentUser,
  details,
  phone,
  persistedMeta,
}) {
  const { hasIdentityUpdates, nextUser } = await updateContactIfChanged({
    api,
    currentUser,
    phone,
  });

  const profile = createProfileSavePayload({ details, persistedMeta });
  await saveProfileDetails({ api, currentUser, profile });

  return { hasIdentityUpdates, nextUser };
}
