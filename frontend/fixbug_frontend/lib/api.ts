const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export async function apiFetch(chemin: string, options: RequestInit = {}) {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const estFormData = options.body instanceof FormData;

  const reponse = await fetch(`${API_URL}${chemin}`, {
    ...options,
    headers: {
      ...(estFormData ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const data = await reponse.json().catch(() => null);

  if (!reponse.ok) {
    if (reponse.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("token");
      window.location.href = "/connexion";
    }
    throw new Error(data?.message || "Une erreur est survenue");
  }

  return data;
}