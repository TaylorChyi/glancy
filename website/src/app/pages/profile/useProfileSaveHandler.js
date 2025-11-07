import { useCallback, useState } from "react";
import { mapProfileDetailsToRequest } from "./profileDetailsModel.js";

async function persistProfile({
  api,
  currentUser,
  details,
  phone,
  persistedMeta,
}) {
  const nextUser = { ...currentUser };
  let hasIdentityUpdates = false;
  const tasks = [];

  if (phone !== currentUser.phone) {
    tasks.push(
      api.users
        .updateContact({
          userId: currentUser.id,
          email: currentUser.email,
          phone,
          token: currentUser.token,
        })
        .then(({ phone: updatedPhone }) => {
          nextUser.phone = updatedPhone;
          hasIdentityUpdates = true;
        }),
    );
  }

  const profilePayload = mapProfileDetailsToRequest(details);
  tasks.push(
    api.profiles.saveProfile({
      token: currentUser.token,
      profile: {
        ...profilePayload,
        dailyWordTarget: persistedMeta.dailyWordTarget,
        futurePlan: persistedMeta.futurePlan,
      },
    }),
  );

  await Promise.all(tasks);
  return { hasIdentityUpdates, nextUser };
}

export function useProfileSaveHandler({
  api,
  currentUser,
  details,
  phone,
  setUser,
  persistedMeta,
  showPopup,
  t,
}) {
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = useCallback(
    async (event) => {
      event.preventDefault();
      if (!currentUser) {
        return;
      }
      setIsSaving(true);
      try {
        const { hasIdentityUpdates, nextUser } = await persistProfile({
          api,
          currentUser,
          details,
          phone,
          persistedMeta,
        });
        if (hasIdentityUpdates) {
          setUser(nextUser);
        }
        showPopup(t.updateSuccess);
      } catch (error) {
        console.error(error);
        showPopup(t.fail);
      } finally {
        setIsSaving(false);
      }
    },
    [
      api,
      currentUser,
      details,
      persistedMeta,
      phone,
      setUser,
      showPopup,
      t.fail,
      t.updateSuccess,
    ],
  );

  return { isSaving, handleSave };
}
