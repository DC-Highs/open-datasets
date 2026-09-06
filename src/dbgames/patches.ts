import { TransformingModel } from "@xcrap/transformer"
import { Localization } from "@dchighs/dc-localization"

let patchesApplied = false

export function applyDbgamesPatches(): void {
    if (patchesApplied) return
    patchesApplied = true

    // Patch 1: Fix @xcrap/transformer lookup of transformed localData keys
    TransformingModel.prototype.transformNestedValue = async function (
        value: any,
        localData: any,
        rootData: any
    ) {
        if (value.condition) {
            const val = value.key
                ? (localData && localData[value.key] !== undefined ? localData[value.key] : rootData?.[value.key])
                : localData
            const data = { local: val, root: rootData }
            if (!value.condition(data)) {
                return value.default
            }
        }
        if (value.multiple) {
            const val = value.key
                ? (localData && localData[value.key] !== undefined ? localData[value.key] : rootData?.[value.key])
                : localData
            const data = { local: val, root: rootData }
            if (!Array.isArray(data.local)) {
                throw new Error("Input data for a 'multiple' nested model must be an array.")
            }
            return await Promise.all(data.local.map((item: any) => value.model.transform(item, data.root)))
        } else {
            const val = value.key
                ? (localData && localData[value.key] !== undefined ? localData[value.key] : rootData?.[value.key])
                : localData
            const data = { local: val, root: rootData }
            if (value.condition && !value.condition(data)) {
                return null
            }
            return await value.model.transform(data.local, data.root)
        }
    }

    // Patch 2: Make Localization.prototype.getKeyFromValue robust against casing and suffix differences
    const origGetKeyFromValue = Localization.prototype.getKeyFromValue
    Localization.prototype.getKeyFromValue = function (value: string): string | undefined {
        if (!value) return undefined

        // 1. Direct match
        const direct = origGetKeyFromValue.call(this, value)
        if (direct) return direct

        const trimmed = value.trim()

        // 2. Case-insensitive search in translations
        const lower = trimmed.toLowerCase()
        const found = Object.entries(this.data as Record<string, string>).find(
            ([, v]) => typeof v === "string" && v.toLowerCase() === lower
        )
        if (found) return found[0]

        // 3. Remove trailing '+' (e.g. 'Enlightenment+' -> 'Enlightenment')
        if (trimmed.endsWith("+")) {
            const withoutPlus = trimmed.slice(0, -1).trim().toLowerCase()
            const foundWithoutPlus = Object.entries(this.data as Record<string, string>).find(
                ([, v]) => typeof v === "string" && v.toLowerCase() === withoutPlus
            )
            if (foundWithoutPlus) return foundWithoutPlus[0]
        }

        // 4. Special fallback aliases
        const aliases: Record<string, string> = {
            "Enlightenment+": "tid_attack_name_64",
            "Enlightening Wisdom+": "tid_attack_name_172",
            "Out Of Time+": "tid_attack_name_174",
            "Out Of Time": "tid_attack_name_65",
        }
        if (aliases[trimmed]) return aliases[trimmed]

        return undefined
    }
}
