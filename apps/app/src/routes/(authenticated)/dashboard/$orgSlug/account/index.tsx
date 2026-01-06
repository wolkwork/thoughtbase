import { createFileRoute } from "@tanstack/react-router";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { ApiKeysTab } from "./api-keys-tab";
import { ProfileTab } from "./profile-tab";
import { SettingsTab } from "./settings-tab";

export const Route = createFileRoute("/(authenticated)/dashboard/$orgSlug/account/")({
  component: AccountPage,
});

function AccountPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-8 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Account</h1>
        <p className="text-muted-foreground">Manage your personal account settings.</p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="api-keys">API Keys</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-6">
          <ProfileTab />
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <SettingsTab />
        </TabsContent>

        <TabsContent value="api-keys" className="mt-6">
          <ApiKeysTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
