export function shouldEnablePreviewSpeedInsights(environment: string | undefined) {
  return environment === "preview";
}
