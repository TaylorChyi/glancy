import { useState, useEffect } from "react";
import { useUser } from "@core/context";
import PaymentModal from "./PaymentModal.jsx";
import Modal from "./Modal.jsx";
import styles from "./UpgradeModal.module.css";
import { useLanguage } from "@core/context";

const PLANS = [
  { id: "free", label: "Free" },
  { id: "month", label: "Monthly \u00a520" },
  { id: "quarter", label: "Quarterly \u00a550" },
  { id: "year", label: "Yearly \u00a5180" },
];

function PlanPicker({ plans, currentPlan, selected, onSelect }) {
  return (
    <div className={styles.plans}>
      {plans.map((plan) => {
        const classes = [
          styles.plan,
          plan.id === currentPlan ? styles.current : "",
          plan.id === selected ? styles.selected : "",
        ]
          .filter(Boolean)
          .join(" ");

        return (
          <div
            key={plan.id}
            className={classes}
            onClick={() => onSelect(plan.id)}
          >
            {plan.label}
          </div>
        );
      })}
    </div>
  );
}

function UpgradeActions({ onConfirm, onCancel, confirmLabel, cancelLabel }) {
  return (
    <div className={styles.actions}>
      <button type="button" onClick={onConfirm}>
        {confirmLabel}
      </button>
      <button type="button" onClick={onCancel}>
        {cancelLabel}
      </button>
    </div>
  );
}

function UpgradeModal({ open, onClose }) {
  const { user } = useUser();
  const currentPlan = user?.plan || "free";
  const [selected, setSelected] = useState(currentPlan);
  const [payOpen, setPayOpen] = useState(false);
  const { t } = useLanguage();
  useEffect(() => {
    if (open) setSelected(currentPlan);
  }, [open, currentPlan]);
  if (!open) return null;
  const handleConfirm = () =>
    selected !== currentPlan ? setPayOpen(true) : onClose();
  const handlePaymentClose = () => { setPayOpen(false); onClose(); };
  return (
    <Modal onClose={onClose} className={`modal-content ${styles["upgrade-modal"]}`}>
      <h3>{t.choosePlan}</h3>
      <PlanPicker plans={PLANS} currentPlan={currentPlan} selected={selected} onSelect={setSelected} />
      <UpgradeActions
        onConfirm={handleConfirm}
        onCancel={onClose}
        confirmLabel={t.confirm}
        cancelLabel={t.cancelButton}
      />
      <PaymentModal open={payOpen} onClose={handlePaymentClose} />
    </Modal>
  );
}

export default UpgradeModal;
