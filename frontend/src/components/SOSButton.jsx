import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

export function SOSButton() {
  const navigate = useNavigate();

  return (
    <motion.button
      type="button"
      onClick={() => navigate("/resources")}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ delay: 1, type: "spring", stiffness: 200 }}
      className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-coral text-sm font-bold text-cream shadow-lg shadow-coral/40 sos-pulse"
      title="Emergency support resources"
      aria-label="SOS - Emergency support resources"
    >
      SOS
    </motion.button>
  );
}
