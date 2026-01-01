/**
 * Assistant Page - Redirects to the AI Assistant (/insights)
 * 
 * This page previously contained a duplicate Analytics dashboard.
 * Now redirects to the proper AI Assistant page at /insights.
 */

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Assistant = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to the AI Assistant page
    navigate('/insights', { replace: true });
  }, [navigate]);

  return null;
};

export default Assistant;
