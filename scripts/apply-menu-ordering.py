from pathlib import Path
import re

p = Path('src/components/AdminModal.tsx')
s = p.read_text(encoding='utf-8')
marker = "// MENU_ORDERING_FEATURE"
if marker in s:
    print('Menu ordering already applied')
    raise SystemExit(0)

s = s.replace(
    "  Download\n} from 'lucide-react';",
    "  Download,\n  GripVertical\n} from 'lucide-react';"
)
s = s.replace(
    "  deleteCategory\n} from '../services/menuService';",
    "  deleteCategory,\n  reorderMenuItemsInCategory\n} from '../services/menuService';"
)

state_anchor = "  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());"
state_code = state_anchor + "\n\n  // MENU_ORDERING_FEATURE\n  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);\n\n  const orderedItems = [...items].sort((a, b) => {\n    const categoryA = categories.find((c) => c.id === a.category)?.sortOrder ?? 999999;\n    const categoryB = categories.find((c) => c.id === b.category)?.sortOrder ?? 999999;\n    if (categoryA !== categoryB) return categoryA - categoryB;\n    const orderA = a.sortOrder ?? items.findIndex((x) => x.id === a.id);\n    const orderB = b.sortOrder ?? items.findIndex((x) => x.id === b.id);\n    return orderA - orderB;\n  });\n\n  const handleMenuItemDrop = async (targetId: string) => {\n    if (!draggedItemId || draggedItemId === targetId) return;\n    const dragged = items.find((x) => x.id === draggedItemId);\n    const target = items.find((x) => x.id === targetId);\n    if (!dragged || !target || dragged.category !== target.category) return;\n\n    const categoryItems = orderedItems.filter((x) => x.category === dragged.category);\n    const from = categoryItems.findIndex((x) => x.id === draggedItemId);\n    const to = categoryItems.findIndex((x) => x.id === targetId);\n    if (from < 0 || to < 0) return;\n\n    const next = [...categoryItems];\n    const [moved] = next.splice(from, 1);\n    next.splice(to, 0, moved);\n    const updates = new Map(next.map((x, index) => [x.id, index]));\n    const updatedItems = items.map((x) => updates.has(x.id) ? { ...x, sortOrder: updates.get(x.id) } : x);\n\n    setDraggedItemId(null);\n    onUpdateItems(updatedItems);\n    try {\n      await reorderMenuItemsInCategory(updatedItems, dragged.category);\n      setSyncBanner(isAr ? 'تم حفظ ترتيب الوجبات' : 'Meal order saved');\n    } catch (error) {\n      console.error('Failed to save meal order:', error);\n      setSyncBanner(isAr ? 'تعذر حفظ ترتيب الوجبات' : 'Could not save meal order');\n    }\n  };"
if state_anchor not in s:
    raise SystemExit('state anchor not found')
s = s.replace(state_anchor, state_code, 1)

old = """                    {items.map((item) => (\n                      <tr key={item.id} className={selectedItemIds.has(item.id) ? 'bg-red-950/20' : 'hover:bg-[#1a1d29]'}>"""
new = """                    {orderedItems.map((item, index) => {\n                      const previous = orderedItems[index - 1];\n                      const categoryChanged = !!previous && previous.category !== item.category;\n                      const category = categories.find((c) => c.id === item.category);\n                      return (\n                      <React.Fragment key={item.id}>\n                        {categoryChanged && (\n                          <tr className=\"bg-[#0a163e] border-t-4 border-[#FFD11A]/40\">\n                            <td colSpan={6} className=\"py-2.5 px-4 text-[#FFD11A] font-black\">\n                              <div className=\"flex items-center justify-between\">\n                                <span>{category ? (isAr ? category.name : isKu ? (category.nameKu || category.nameEn || category.name) : category.nameEn) : item.category}</span>\n                                <span className=\"text-[10px] text-[#9eb9fc]\">{orderedItems.filter(x => x.category === item.category).length} {isAr ? 'وجبات' : 'items'}</span>\n                              </div>\n                            </td>\n                          </tr>\n                        )}\n                        <tr\n                          key={item.id}\n                          draggable\n                          onDragStart={() => setDraggedItemId(item.id)}\n                          onDragOver={(e) => { if (draggedItemId && draggedItemId !== item.id && items.find(x => x.id === draggedItemId)?.category === item.category) e.preventDefault(); }}\n                          onDrop={(e) => { e.preventDefault(); void handleMenuItemDrop(item.id); }}\n                          onDragEnd={() => setDraggedItemId(null)}\n                          className={`${selectedItemIds.has(item.id) ? 'bg-red-950/20' : 'hover:bg-[#1a1d29]'} ${draggedItemId === item.id ? 'opacity-40' : ''} cursor-grab active:cursor-grabbing ${!previous || previous.category !== item.category ? 'border-t-4 border-[#FFD11A]/40' : ''}`}\n                        >\n                        <td className=\"py-3 px-2 text-center\">\n                          <GripVertical className=\"w-4 h-4 mx-auto text-[#FFD11A]/70\" title={isAr ? 'اسحب لترتيب الوجبة' : 'Drag to reorder'} />\n                        </td>"""
if old not in s:
    raise SystemExit('table map anchor not found')
s = s.replace(old, new, 1)

# The original first checkbox cell must remain; our drag handle is added before it.
# Close the fragment/map after the original row closing tag.
needle = """                      </tr>\n                    ))}"""
replacement = """                      </tr>\n                      </React.Fragment>\n                      );\n                    })}"""
if needle not in s:
    raise SystemExit('table map closing anchor not found')
s = s.replace(needle, replacement, 1)

p.write_text(s, encoding='utf-8')
print('Applied menu ordering feature')
