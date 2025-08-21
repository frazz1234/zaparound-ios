/**
 * Get the full name from first_name and last_name fields
 * @param firstName - User's first name
 * @param lastName - User's last name
 * @returns Full name string or empty string if both are null
 */
export function getFullName(firstName: string | null, lastName: string | null): string {
  if (!firstName && !lastName) return '';
  if (!firstName) return lastName || '';
  if (!lastName) return firstName;
  return `${firstName} ${lastName}`.trim();
}

/**
 * Get the first name from a full name string (for backward compatibility)
 * @param fullName - Full name string
 * @returns First name or the full name if no space is found
 */
export function getFirstName(fullName: string | null): string {
  if (!fullName) return '';
  const parts = fullName.split(' ');
  return parts[0] || '';
}

/**
 * Get the last name from a full name string (for backward compatibility)
 * @param fullName - Full name string
 * @returns Last name or empty string if no space is found
 */
export function getLastName(fullName: string | null): string {
  if (!fullName) return '';
  const parts = fullName.split(' ');
  return parts.slice(1).join(' ') || '';
}

/**
 * Get the display name from profile data, prioritizing username over first/last name
 * @param profile - Profile object with username, first_name, and last_name
 * @returns Display name string
 */
export function getDisplayName(profile: {
  username?: string;
  first_name?: string;
  last_name?: string;
} | null): string {
  if (!profile) return 'Anonymous';
  if (profile.username) return profile.username;
  if (profile.first_name || profile.last_name) {
    return getFullName(profile.first_name || null, profile.last_name || null);
  }
  return 'Anonymous';
}
