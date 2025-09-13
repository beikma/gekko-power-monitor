import { TeamsConfiguration } from "@/components/TeamsConfiguration";
import { TeamsConfigurationTest } from "@/components/TeamsConfigurationTest";

export default function TeamsIntegration() {
  return (
    <div className="container mx-auto px-4 py-8">
      <TeamsConfigurationTest />
      <div className="mt-8">
        <TeamsConfiguration />
      </div>
    </div>
  );
}