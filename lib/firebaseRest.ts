export type FirebasePublicConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  appId: string;
  configured: boolean;
};

export type FirebaseAuthSession = {
  idToken: string;
  email: string;
  localId: string;
  expiresAt: number;
};

type FirestoreDocument = {
  fields?: Record<string, FirestoreValue>;
  updateTime?: string;
};

type FirestoreValue = {
  nullValue?: null;
  stringValue?: string;
  booleanValue?: boolean;
  integerValue?: string;
  doubleValue?: number;
  timestampValue?: string;
  arrayValue?: {
    values?: FirestoreValue[];
  };
  mapValue?: {
    fields?: Record<string, FirestoreValue>;
  };
};

type FirebaseAuthResponse = {
  idToken?: string;
  email?: string;
  localId?: string;
  expiresIn?: string;
};

export function getFirebasePublicConfig(): FirebasePublicConfig {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "";
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "";

  return {
    apiKey,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
    projectId,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "",
    configured: Boolean(apiKey && projectId),
  };
}

export async function signInWithFirebaseEmail(
  email: string,
  password: string
): Promise<FirebaseAuthSession> {
  const config = getFirebasePublicConfig();

  if (!config.configured) {
    throw new Error("Firebase is missing NEXT_PUBLIC_FIREBASE_API_KEY or NEXT_PUBLIC_FIREBASE_PROJECT_ID.");
  }

  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${encodeURIComponent(
      config.apiKey
    )}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
        returnSecureToken: true,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(await readFirebaseError(response));
  }

  const data = (await response.json()) as FirebaseAuthResponse;

  if (!data.idToken || !data.email || !data.localId) {
    throw new Error("Firebase did not return a complete sign-in session.");
  }

  return {
    idToken: data.idToken,
    email: data.email,
    localId: data.localId,
    expiresAt: Date.now() + Number(data.expiresIn ?? "3600") * 1000,
  };
}

export async function readFirestoreDocument<T extends Record<string, unknown>>(
  documentPath: string,
  idToken?: string
): Promise<T | null> {
  const config = getFirebasePublicConfig();

  if (!config.configured) {
    return null;
  }

  const response = await fetch(buildFirestoreDocumentUrl(config, documentPath), {
    cache: "no-store",
    headers: createFirestoreHeaders(idToken),
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(await readFirebaseError(response));
  }

  const document = (await response.json()) as FirestoreDocument;

  return firestoreFieldsToJson(document.fields ?? {}) as T;
}

export async function writeFirestoreDocument(
  documentPath: string,
  data: Record<string, unknown>,
  idToken: string
) {
  const config = getFirebasePublicConfig();

  if (!config.configured) {
    throw new Error("Firebase is missing NEXT_PUBLIC_FIREBASE_API_KEY or NEXT_PUBLIC_FIREBASE_PROJECT_ID.");
  }

  const response = await fetch(buildFirestoreDocumentUrl(config, documentPath), {
    method: "PATCH",
    headers: createFirestoreHeaders(idToken),
    body: JSON.stringify({
      fields: jsonToFirestoreFields(data),
    }),
  });

  if (!response.ok) {
    throw new Error(await readFirebaseError(response));
  }
}

export async function createFirestoreDocument(
  collectionPath: string,
  data: Record<string, unknown>,
  idToken?: string
) {
  const config = getFirebasePublicConfig();

  if (!config.configured) {
    throw new Error("Firebase is missing NEXT_PUBLIC_FIREBASE_API_KEY or NEXT_PUBLIC_FIREBASE_PROJECT_ID.");
  }

  const response = await fetch(buildFirestoreCollectionUrl(config, collectionPath), {
    method: "POST",
    headers: createFirestoreHeaders(idToken),
    body: JSON.stringify({
      fields: jsonToFirestoreFields(data),
    }),
  });

  if (!response.ok) {
    throw new Error(await readFirebaseError(response));
  }
}

function createFirestoreHeaders(idToken?: string) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (idToken) {
    headers.Authorization = `Bearer ${idToken}`;
  }

  return headers;
}

function buildFirestoreDocumentUrl(
  config: FirebasePublicConfig,
  documentPath: string
) {
  const encodedPath = documentPath.split("/").map(encodeURIComponent).join("/");
  const url = new URL(
    `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(
      config.projectId
    )}/databases/(default)/documents/${encodedPath}`
  );

  url.searchParams.set("key", config.apiKey);

  return url.toString();
}

function buildFirestoreCollectionUrl(
  config: FirebasePublicConfig,
  collectionPath: string
) {
  const encodedPath = collectionPath.split("/").map(encodeURIComponent).join("/");
  const url = new URL(
    `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(
      config.projectId
    )}/databases/(default)/documents/${encodedPath}`
  );

  url.searchParams.set("key", config.apiKey);

  return url.toString();
}

function firestoreFieldsToJson(fields: Record<string, FirestoreValue>) {
  return Object.fromEntries(
    Object.entries(fields).map(([key, value]) => [
      key,
      firestoreValueToJson(value),
    ])
  );
}

function firestoreValueToJson(value: FirestoreValue): unknown {
  if ("stringValue" in value) {
    return value.stringValue ?? "";
  }

  if ("booleanValue" in value) {
    return Boolean(value.booleanValue);
  }

  if ("integerValue" in value) {
    return Number(value.integerValue ?? "0");
  }

  if ("doubleValue" in value) {
    return Number(value.doubleValue ?? 0);
  }

  if ("timestampValue" in value) {
    return value.timestampValue ?? "";
  }

  if ("arrayValue" in value) {
    return (value.arrayValue?.values ?? []).map((item) =>
      firestoreValueToJson(item)
    );
  }

  if ("mapValue" in value) {
    return firestoreFieldsToJson(value.mapValue?.fields ?? {});
  }

  return null;
}

function jsonToFirestoreFields(data: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(data)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => [key, jsonToFirestoreValue(value)])
  );
}

function jsonToFirestoreValue(value: unknown): FirestoreValue {
  if (value === null || value === undefined) {
    return { nullValue: null };
  }

  if (typeof value === "string") {
    return { stringValue: value };
  }

  if (typeof value === "boolean") {
    return { booleanValue: value };
  }

  if (typeof value === "number") {
    return Number.isInteger(value)
      ? { integerValue: String(value) }
      : { doubleValue: value };
  }

  if (Array.isArray(value)) {
    return {
      arrayValue: {
        values: value.map((item) => jsonToFirestoreValue(item)),
      },
    };
  }

  if (typeof value === "object") {
    return {
      mapValue: {
        fields: jsonToFirestoreFields(value as Record<string, unknown>),
      },
    };
  }

  return { nullValue: null };
}

async function readFirebaseError(response: Response) {
  try {
    const body = (await response.json()) as {
      error?: {
        message?: string;
      };
    };
    const message = body.error?.message;

    return message
      ? `${response.status} ${response.statusText}: ${message}`
      : `${response.status} ${response.statusText}`;
  } catch {
    return `${response.status} ${response.statusText}`;
  }
}
