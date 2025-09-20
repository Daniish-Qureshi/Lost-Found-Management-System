import { useEffect, useState } from "react"
import { addItem, deleteItem, listenToItems } from "./firestore-client"

interface Item {
  id: string
  name: string
  type: string
  location: string
  date: string
}

export default function App() {
  const [items, setItems] = useState<Item[]>([])
  const [name, setName] = useState("")
  const [type, setType] = useState("lost")
  const [location, setLocation] = useState("")
  const [date, setDate] = useState("")

  useEffect(() => {
    const unsub = listenToItems(setItems)
    return () => unsub()
  }, [])

  const handleAdd = async () => {
    if (!name.trim()) return alert("Enter item name")
    await addItem({ name, type, location, date })
    setName(""); setLocation(""); setDate(""); setType("lost")
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this item?")) return
    await deleteItem(id)
  }

  return (
    <div style={{ maxWidth: 600, margin: "auto", padding: 20 }}>
      <h1>Lost & Found Portal</h1>

      <div style={{ marginBottom: 20 }}>
        <input
          placeholder="Item name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="lost">Lost</option>
          <option value="found">Found</option>
        </select>
        <input
          placeholder="Location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <button onClick={handleAdd}>Add Item</button>
      </div>

      <ul>
        {items.map((it) => (
          <li key={it.id}>
            <strong>{it.name}</strong> — {it.type} — {it.location} — {it.date}
            <button onClick={() => handleDelete(it.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  )
}
