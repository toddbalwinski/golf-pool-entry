import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function GolfersPage() {
  const [golfers,   setGolfers]   = useState([])
  const [loading,   setLoading]   = useState(true)
  const [newName,   setNewName]   = useState('')
  const [newSalary, setNewSalary] = useState('')
  const [csvFile,   setCsvFile]   = useState(null)
  const [busy,      setBusy]      = useState(false)

  const loadGolfers = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('golfers')
      .select('*')
      .order('id', { ascending: true })
    if (error) {
      console.error(error)
      alert('Failed to load golfers')
    } else {
      setGolfers(data)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadGolfers()
  }, [])

  const addGolfer = async (e) => {
    e.preventDefault()
    if (!newName.trim() || !newSalary) return
    setBusy(true)
    const { error } = await supabase
      .from('golfers')
      .insert({ name: newName.trim(), salary: +newSalary })
    if (error) {
      console.error(error)
      alert('Insert failed: ' + error.message)
    } else {
      setNewName('')
      setNewSalary('')
      await loadGolfers()
    }
    setBusy(false)
  }

  const deleteGolfer = async (id) => {
    if (!confirm('Are you sure you want to delete this golfer?')) return
    setBusy(true)
    const { error } = await supabase
      .from('golfers')
      .delete()
      .eq('id', id)
    if (error) {
      console.error(error)
      alert('Delete failed: ' + error.message)
    } else {
      await loadGolfers()
    }
    setBusy(false)
  }

  const uploadCsv = async () => {
    if (!csvFile) return alert('Choose a CSV file first')
    setBusy(true)
    try {
      const text = await csvFile.text()
      const rows = text
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.length > 0)
      const start = rows[0].toLowerCase().startsWith('name') ? 1 : 0
      const data = rows.slice(start).map((l) => {
        const [name, salary] = l.split(',').map((s) => s.trim())
        return { name, salary: +salary }
      })
      const { error } = await supabase
        .from('golfers')
        .insert(data)
      if (error) throw error
      setCsvFile(null)
      await loadGolfers()
    } catch (err) {
      console.error(err)
      alert('CSV upload failed: ' + err.message)
    }
    setBusy(false)
  }

  const clearAllGolfers = async () => {
    if (!confirm('This will delete ALL golfers. Continue?')) return
    setBusy(true)
    const { error } = await supabase
      .from('golfers')
      .delete()
      .gt('id', 0)
    if (error) {
      console.error(error)
      alert('Clear all failed: ' + error.message)
    } else {
      await loadGolfers()
    }
    setBusy(false)
  }

  if (loading) {
    return (
      <div className="p-6 text-center">
        Loading golfers…
      </div>
    )
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-screen-lg mx-auto space-y-8">
        <h1 className="text-2xl font-bold text-dark-green">
          Manage Golfers
        </h1>

        {/* CSV Upload & Clear All */}
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-800">
              Upload CSV (name,salary)
            </label>
            <input
              type="file"
              accept=".csv"
              onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
              className="mt-1 block"
            />
          </div>
          <button
            onClick={uploadCsv}
            disabled={busy || !csvFile}
            className="bg-dark-green text-white px-4 py-2 rounded disabled:opacity-50 hover:bg-dark-green/90"
          >
            Upload CSV
          </button>
          <button
            onClick={clearAllGolfers}
            disabled={busy}
            className="ml-auto bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            Clear All Golfers
          </button>
        </div>

        {/* Add a Single Golfer */}
        <form
          onSubmit={addGolfer}
          className="flex flex-wrap gap-4 items-end"
        >
          <div className="flex-1 min-w-[150px]">
            <label className="block text-sm font-medium text-gray-800">
              Name
            </label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded p-2"
              required
            />
          </div>
          <div className="w-32">
            <label className="block text-sm font-medium text-gray-800">
              Salary
            </label>
            <input
              type="number"
              value={newSalary}
              onChange={(e) => setNewSalary(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded p-2"
              required
            />
          </div>
          <button
            type="submit"
            disabled={busy}
            className="bg-dark-green text-white px-4 py-2 rounded disabled:opacity-50 hover:bg-dark-green/90"
          >
            Add Golfer
          </button>
        </form>

        {/* Golfers Table */}
        <div className="overflow-x-auto border border-dark-green rounded-lg">
          <table className="w-full table-auto border-collapse text-sm whitespace-nowrap">
            <thead>
              <tr className="bg-gray-100">
                {['ID','Name','Salary','Delete'].map((h) => (
                  <th key={h} className="border px-4 py-2 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200">
              {golfers.map((g) => (
                <tr key={g.id} className="odd:bg-white even:bg-gray-50">
                  <td className="border px-4 py-2 whitespace-nowrap">
                    {g.id}
                  </td>
                  <td className="border px-4 py-2 whitespace-nowrap">
                    {g.name}
                  </td>
                  <td className="border px-4 py-2 whitespace-nowrap">
                    ${g.salary}
                  </td>
                  <td className="px-4 py-2 text-center">
                    <button
                      onClick={() => deleteGolfer(g.id)}
                      disabled={busy}
                      className="text-red-600 hover:text-red-700 disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}