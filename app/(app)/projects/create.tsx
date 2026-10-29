import { CreateProjectWizard } from '@/components/projects/CreateProjectWizard';

// The wizard resets the project model itself and paints its own background/header.
export default function CreateProjectPage() {
  return <CreateProjectWizard />;
}
