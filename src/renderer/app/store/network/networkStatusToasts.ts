export function buildOfflineToastMessage(firstName: string | null): string {
  if (firstName) {
    return `${firstName}, you've lost your connection. Custocare is paused until you're back online.`;
  }
  return "You've lost your connection. Custocare is paused until you're back online.";
}

export function buildOnlineToastMessage(firstName: string | null): string {
  if (firstName) {
    return `Welcome back, ${firstName}. You're connected again.`;
  }
  return "You're back online. Connection restored.";
}
