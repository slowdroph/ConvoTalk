export const SALT_ROUNDS = 10;
export const PUBLIC_USER_SELECT = "name publicId avatar status country";
export const SENDER_USER_SELECT = "name publicId avatar status";
export const POST_AUTHOR_SELECT = "name publicId avatar status country city";
export const POST_IMAGE_FOLDER = "chat_app_posts";
export const PROFILE_USER_SELECT =
    "name publicId avatar status country city bio interests gender birthdate languages languageLevels lastSeen createdAt";
export const DISCOVER_USER_SELECT =
    "name publicId avatar status country city bio interests languages languageLevels lastSeen createdAt";
export const DISCOVER_USER_PROJECTION = {
    name: 1,
    publicId: 1,
    avatar: 1,
    status: 1,
    country: 1,
    city: 1,
    bio: 1,
    interests: 1,
    languages: 1,
    languageLevels: 1,
    lastSeen: 1,
    createdAt: 1,
} as const;
