import { useCallback, useEffect, useState } from "react";

export default function useEditableField(disabled = true) {
  const [editing, setEditing] = useState(!disabled);

  useEffect(() => {
    setEditing(!disabled);
  }, [disabled]);

  const enableEdit = useCallback(() => {
    setEditing(true);
  }, []);

  return { editing, enableEdit };
}
