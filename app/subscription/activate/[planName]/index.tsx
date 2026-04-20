import { Screen } from '@/components/shared';
import ActivatePlan from '@/components/billing/ActivatePlan';

export default function ActivatePlanScreen() {
  return (
    <Screen title="Subscribe" scrollable={false}>
      <ActivatePlan />
    </Screen>
  );
}
