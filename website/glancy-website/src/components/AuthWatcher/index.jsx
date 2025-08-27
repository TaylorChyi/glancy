import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useUser } from "@/context/UserContext.jsx";

function AuthWatcher() {
  const { user } = useUser();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (
      !user &&
      location.pathname !== "/login" &&
      location.pathname !== "/register"
    ) {
      navigate("/login", { replace: true });
    }
  }, [user, location, navigate]);

  return null;
}

export default AuthWatcher;
