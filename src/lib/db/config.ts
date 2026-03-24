import { connection } from "next/server"

import type { ServerConfig } from "@/types/database"

export async function getServerConfigs(): Promise<ServerConfig[]> {
  await connection()

  const configs: ServerConfig[] = []

  for (let i = 1; ; i++) {
    const prefix = `DB_${i}_`
    const displayName = process.env[`${prefix}DISPLAY_NAME`]
    const host = process.env[`${prefix}HOST`]
    const user = process.env[`${prefix}USERNAME`]
    const password = process.env[`${prefix}PASSWORD`]
    const autodiscoverRaw = process.env[`${prefix}AUTODISCOVER`]
    const databasesRaw = process.env[`${prefix}DATABASES`]

    if (!displayName && !host) {
      break
    }

    if (!host || !user) {
      console.warn(
        `Server config DB_${i} is incomplete (missing HOST or USERNAME). Skipping.`,
      )
      continue
    }

    const databases = databasesRaw
      ? databasesRaw
          .split(",")
          .map((d) => d.trim())
          .filter(Boolean)
      : null

    const configError = resolveConfigError(i, autodiscoverRaw, databases)

    const autodiscover =
      autodiscoverRaw === "true" || (!autodiscoverRaw && !databases)

    configs.push({
      id: String(i),
      displayName: displayName || `Server ${i}`,
      host,
      port: parseInt(process.env[`${prefix}PORT`] || "5432", 10),
      user,
      password: password || "",
      ssl: process.env[`${prefix}SSL`] === "true",
      autodiscover,
      databases,
      configError: configError ?? undefined,
    })
  }

  return configs
}

function resolveConfigError(
  index: number,
  autodiscoverRaw: string | undefined,
  databases: string[] | null,
): string | null {
  if (autodiscoverRaw === "true" && databases && databases.length > 0) {
    return `DB_${index}_AUTODISCOVER and DB_${index}_DATABASES are mutually exclusive. Set one or the other, not both.`
  }

  if (autodiscoverRaw === "false" && (!databases || databases.length === 0)) {
    return `DB_${index}_AUTODISCOVER is false but DB_${index}_DATABASES is not set. Provide a comma-separated list of databases.`
  }

  return null
}

export async function getServerConfig(
  id: string,
): Promise<ServerConfig | undefined> {
  const configs = await getServerConfigs()
  return configs.find((c) => c.id === id)
}
