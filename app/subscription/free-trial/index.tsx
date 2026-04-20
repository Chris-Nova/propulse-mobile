import { Screen } from '@/components/shared';
import FreeTrial from '@/components/billing/FreeTrial';

export default function FreeTrialScreen() {
  return (
    <Screen title="Free Trial" scrollable={false}>
      <FreeTrial />
    </Screen>
  );
}
