"use client";

import PageShell from "@/shared/components/PageShell";
import Card from "@/shared/components/Card";
import Alert from "@/shared/components/Alert";
import ProfileForm from "../components/ProfileForm";
import PasswordForm from "../components/PasswordForm";
import { useSettingsPageState } from "../hooks/use-settings";

export default function SettingsPage() {
  const {
    isLoading,
    loadError,
    profileValues,
    profileErrors,
    profileFormError,
    profileSubmitting,
    handleProfileChange,
    handleProfileSubmit,
    passwordValues,
    passwordErrors,
    passwordFormError,
    passwordSubmitting,
    handlePasswordChange,
    handlePasswordSubmit,
  } = useSettingsPageState();

  return (
    <PageShell>
      <section className="px-container-margin-mobile py-8 sm:py-10 md:px-container-margin-desktop md:py-12">
        <div className="mx-auto max-w-3xl space-y-6">
          <div>
            <h1 className="font-sans text-h1-desktop text-on-surface">Settings</h1>
            <p className="mt-1 text-body-lg text-on-surface-variant">
              Manage your profile details and account password.
            </p>
          </div>

          {isLoading ? (
            <div className="space-y-6">
              <Card className="h-56 animate-pulse p-6 md:p-8">{null}</Card>
              <Card className="h-72 animate-pulse p-6 md:p-8">{null}</Card>
            </div>
          ) : loadError ? (
            <Alert variant="error">{loadError}</Alert>
          ) : (
            <>
              <ProfileForm
                values={profileValues}
                formErrors={profileErrors}
                formError={profileFormError}
                submitLoading={profileSubmitting}
                onChange={handleProfileChange}
                onSubmit={handleProfileSubmit}
              />

              <PasswordForm
                values={passwordValues}
                formErrors={passwordErrors}
                formError={passwordFormError}
                submitLoading={passwordSubmitting}
                onChange={handlePasswordChange}
                onSubmit={handlePasswordSubmit}
              />
            </>
          )}
        </div>
      </section>
    </PageShell>
  );
}
