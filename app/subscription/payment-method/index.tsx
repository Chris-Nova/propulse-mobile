import { Screen } from '@/components/shared';
import PaymentMethod from '@/components/billing/PaymentMethod';

export default function PaymentMethodScreen() {
  return (
    <Screen title="Payment Method" scrollable={false}>
      <PaymentMethod />
    </Screen>
  );
}
