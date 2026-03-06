"use server"

import { revalidatePath } from "next/cache"
import { getServerConfig } from "@/lib/db/config"
import { createDatabase } from "@/lib/db/queries"

const DB_NAME_RE = /^[a-zA-Z_][a-zA-Z0-9_]*$/

export async function createDatabaseAction(
  serverId: string,
  _prev: { success: boolean; error?: string },
  formData: FormData,
): Promise<{ success: boolean; error?: string }> {
  const name = (formData.get("name") as string | null)?.trim() ?? ""

  if (!name) {
    return { success: false, error: "Database name is required." }
  }

  if (!DB_NAME_RE.test(name)) {
    return {
      success: false,
      error:
        "Name must start with a letter or underscore and contain only letters, digits, or underscores.",
    }
  }

  const config = getServerConfig(serverId)
  if (!config) {
    return { success: false, error: "Server not found." }
  }

  try {
    await createDatabase(config, name)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return { success: false, error: message }
  }

  revalidatePath(`/server/${serverId}`)
  return { success: true }
}
