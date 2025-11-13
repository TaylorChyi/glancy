import { useCallback, useState } from "react";
import { persistProfile } from "./profilePersistence.js";

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
