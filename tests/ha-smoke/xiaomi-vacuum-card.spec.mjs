import { expect, test } from "@playwright/test";

const SMOKE_USER_NAME = "Smoke User";
const SMOKE_USERNAME = "smoke";
const SMOKE_PASSWORD = "smoke-test-password";

const isFaviconNoise = (message) => message.toLowerCase().includes("favicon");

const trimTrailingSlash = (url) => url.replace(/\/+$/, "");

const readResponseText = async (response) => {
  const body = await response.text();

  return body ? `${response.status()} ${body}` : `${response.status()}`;
};

const getOnboardingSteps = async (request) => {
  const response = await request.get("/api/onboarding", { failOnStatusCode: false });

  if (!response.ok()) {
    throw new Error(
      `Unable to read Home Assistant onboarding status: ${await readResponseText(response)}`,
    );
  }

  return response.json();
};

const isOnboardingComplete = (steps) => steps.length > 0 && steps.every((step) => step.done);

const isOnboardingStepDone = (steps, name) => steps.some((step) => step.step === name && step.done);

const postOnboardingStep = async (request, url, accessToken) => {
  const response = await request.post(url, {
    failOnStatusCode: false,
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok()) {
    throw new Error(
      `Unable to complete Home Assistant onboarding step ${url}: ${await readResponseText(response)}`,
    );
  }
};

const exchangeAuthCode = async (request, authCode, clientId) => {
  const response = await request.post("/auth/token", {
    failOnStatusCode: false,
    form: {
      grant_type: "authorization_code",
      code: authCode,
      client_id: clientId,
    },
  });

  if (!response.ok()) {
    throw new Error(
      `Unable to exchange Home Assistant onboarding auth code: ${await readResponseText(response)}`,
    );
  }

  const token = await response.json();

  if (!token.access_token) {
    throw new Error("Home Assistant onboarding token response did not include an access_token");
  }

  return token.access_token;
};

async function waitForHomeAssistant(request) {
  await expect
    .poll(
      async () => {
        try {
          const response = await request.get("/manifest.json", { failOnStatusCode: false });

          return response.status();
        } catch {
          return 0;
        }
      },
      {
        intervals: [500, 1_000, 2_000],
        timeout: 45_000,
        message: "Home Assistant did not become ready at /manifest.json",
      },
    )
    .toBe(200);
}

async function completeOnboardingIfNeeded(request, baseURL) {
  const clientId = trimTrailingSlash(baseURL || "http://127.0.0.1:8123");
  const redirectUri = `${clientId}/auth/external/callback`;
  let steps = await getOnboardingSteps(request);

  if (isOnboardingComplete(steps)) {
    return;
  }

  let accessToken;

  if (!isOnboardingStepDone(steps, "user")) {
    const response = await request.post("/api/onboarding/users", {
      failOnStatusCode: false,
      data: {
        name: SMOKE_USER_NAME,
        username: SMOKE_USERNAME,
        password: SMOKE_PASSWORD,
        client_id: clientId,
        language: "en",
      },
    });

    if (!response.ok()) {
      throw new Error(
        `Unable to create Home Assistant smoke user: ${await readResponseText(response)}`,
      );
    }

    const user = await response.json();

    if (!user.auth_code) {
      throw new Error("Home Assistant onboarding user response did not include an auth_code");
    }

    accessToken = await exchangeAuthCode(request, user.auth_code, clientId);
    steps = await getOnboardingSteps(request);
  }

  if (!accessToken && !isOnboardingComplete(steps)) {
    throw new Error(
      "Home Assistant onboarding is partially complete and no onboarding auth token is available",
    );
  }

  if (!isOnboardingStepDone(steps, "core_config")) {
    await postOnboardingStep(request, "/api/onboarding/core_config", accessToken);
  }

  if (!isOnboardingStepDone(steps, "analytics")) {
    await postOnboardingStep(request, "/api/onboarding/analytics", accessToken);
  }

  if (!isOnboardingStepDone(steps, "integration")) {
    const response = await request.post("/api/onboarding/integration", {
      failOnStatusCode: false,
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { client_id: clientId, redirect_uri: redirectUri },
    });

    if (!response.ok()) {
      throw new Error(
        `Unable to complete Home Assistant integration onboarding for client_id=${clientId} redirect_uri=${redirectUri}: ${await readResponseText(response)}`,
      );
    }
  }

  steps = await getOnboardingSteps(request);

  if (!isOnboardingComplete(steps)) {
    throw new Error(`Home Assistant onboarding did not complete: ${JSON.stringify(steps)}`);
  }
}

async function openSmokeDashboard(page) {
  await page.goto("/lovelace/smoke", { waitUntil: "domcontentloaded" });

  const smokeUser = page.getByText(SMOKE_USER_NAME, { exact: true }).first();
  const smokeUserVisible = await smokeUser
    .waitFor({ state: "visible", timeout: 5_000 })
    .then(() => true)
    .catch(() => false);

  if (smokeUserVisible) {
    await smokeUser.click();
    await page.waitForLoadState("domcontentloaded", { timeout: 10_000 }).catch(() => {});
  }

  if (new URL(page.url()).pathname !== "/lovelace/smoke") {
    await page.goto("/lovelace/smoke", { waitUntil: "domcontentloaded" });
  }
}

test("loads the Xiaomi vacuum card in Home Assistant", async ({ page, request, baseURL }) => {
  const fatalErrors = [];

  page.on("pageerror", (error) => {
    const message = error.message || String(error);

    if (!isFaviconNoise(message)) {
      fatalErrors.push(`pageerror: ${message}`);
    }
  });

  page.on("console", (message) => {
    if (message.type() !== "error") {
      return;
    }

    const details = [message.text(), message.location().url].filter(Boolean).join(" ");

    if (!isFaviconNoise(details)) {
      fatalErrors.push(`console error: ${details}`);
    }
  });

  await waitForHomeAssistant(request);
  await completeOnboardingIfNeeded(request, baseURL);
  await openSmokeDashboard(page);

  await page.waitForFunction(() => globalThis.customElements.get("xiaomi-vacuum-card"), undefined, {
    timeout: 45_000,
  });

  await expect(page.locator("xiaomi-vacuum-card").first()).toBeAttached();
  expect(fatalErrors, fatalErrors.join("\n")).toEqual([]);
});
