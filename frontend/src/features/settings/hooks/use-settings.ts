import { useEffect, useState, type FormEvent } from "react";
import { useToast } from "@/shared/components/Toast";
import { ApiError } from "@/shared/services/api";
import { changeCurrentUserPassword, fetchCurrentUser, updateCurrentUser } from "../services/settings.service";
import type { PasswordFormValues, ProfileFormValues } from "../types/settings.types";

const emptyProfileValues: ProfileFormValues = { name: "", email: "" };
const emptyPasswordValues: PasswordFormValues = {
  currentPassword: "",
  newPassword: "",
  confirmNewPassword: "",
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateProfile(values: ProfileFormValues) {
  const errors: Partial<Record<keyof ProfileFormValues, string>> = {};

  if (!values.name.trim()) {
    errors.name = "Name is required.";
  }

  if (!values.email.trim()) {
    errors.email = "Email is required.";
  } else if (!EMAIL_PATTERN.test(values.email.trim())) {
    errors.email = "Enter a valid email address.";
  }

  return errors;
}

function validatePassword(values: PasswordFormValues) {
  const errors: Partial<Record<keyof PasswordFormValues, string>> = {};

  if (!values.currentPassword) {
    errors.currentPassword = "Current password is required.";
  }

  if (values.newPassword.length < 8) {
    errors.newPassword = "Password must be at least 8 characters.";
  }

  if (values.confirmNewPassword.length < 8) {
    errors.confirmNewPassword = "Confirm password must be at least 8 characters.";
  } else if (values.newPassword !== values.confirmNewPassword) {
    errors.confirmNewPassword = "Passwords do not match.";
  }

  return errors;
}

export function useSettingsPageState() {
  const { showToast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [profileValues, setProfileValues] = useState<ProfileFormValues>(emptyProfileValues);
  const [profileErrors, setProfileErrors] = useState<Partial<Record<keyof ProfileFormValues, string>>>({});
  const [profileFormError, setProfileFormError] = useState<string | null>(null);
  const [profileSubmitting, setProfileSubmitting] = useState(false);

  const [passwordValues, setPasswordValues] = useState<PasswordFormValues>(emptyPasswordValues);
  const [passwordErrors, setPasswordErrors] = useState<Partial<Record<keyof PasswordFormValues, string>>>({});
  const [passwordFormError, setPasswordFormError] = useState<string | null>(null);
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadProfile() {
      try {
        const profile = await fetchCurrentUser();
        if (!mounted) return;
        setProfileValues({ name: profile.name, email: profile.email });
      } catch (err) {
        if (!mounted) return;
        setLoadError(err instanceof ApiError ? err.message : "Unable to load your profile right now.");
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    void loadProfile();
    return () => {
      mounted = false;
    };
  }, []);

  const handleProfileChange = (field: keyof ProfileFormValues, value: string) => {
    setProfileValues((prev) => ({ ...prev, [field]: value }));
    setProfileErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
  };

  const handleProfileSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setProfileFormError(null);

    const errors = validateProfile(profileValues);
    if (Object.keys(errors).length > 0) {
      setProfileErrors(errors);
      return;
    }

    setProfileErrors({});
    setProfileSubmitting(true);

    try {
      const updated = await updateCurrentUser({
        name: profileValues.name.trim(),
        email: profileValues.email.trim(),
      });
      setProfileValues({ name: updated.name, email: updated.email });
      showToast("Profile updated successfully.", "success");
    } catch (err) {
      setProfileFormError(err instanceof ApiError ? err.message : "Unable to update your profile.");
    } finally {
      setProfileSubmitting(false);
    }
  };

  const handlePasswordChange = (field: keyof PasswordFormValues, value: string) => {
    setPasswordValues((prev) => ({ ...prev, [field]: value }));
    setPasswordErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
  };

  const handlePasswordSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPasswordFormError(null);

    const errors = validatePassword(passwordValues);
    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors);
      return;
    }

    setPasswordErrors({});
    setPasswordSubmitting(true);

    try {
      await changeCurrentUserPassword(passwordValues);
      setPasswordValues(emptyPasswordValues);
      showToast("Password updated successfully.", "success");
    } catch (err) {
      setPasswordFormError(err instanceof ApiError ? err.message : "Unable to update your password.");
    } finally {
      setPasswordSubmitting(false);
    }
  };

  return {
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
  };
}
